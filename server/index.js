require("dotenv").config();
const { Resend } = require("resend");
const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const app = express();
const prisma = new PrismaClient();

const resend = new Resend(process.env.RESEND_API_KEY);
const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://resume-builder-alexbeard.vercel.app", // ← замени на свой
    ],
  }),
);
app.use(express.json());

// Функция генерации токенов
function generateTokens(user) {
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: "15m" }, // ← Короткий срок
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    REFRESH_SECRET,
    { expiresIn: "30d" }, // ← Долгий срок
  );

  return { accessToken, refreshToken };
}

// Middleware для проверки access token
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Токен не предоставлен" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Недействительный токен" });
  }
}

// ============ АВТОРИЗАЦИЯ ============

// Регистрация
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, name, username } = req.body;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ error: "Пользователь или username уже существует" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name, username },
    });

    const { accessToken, refreshToken } = generateTokens(user);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// Вход
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!user || !isPasswordValid) {
      return res.status(401).json({ error: "Неверный email или пароль" });
    }

    const { accessToken, refreshToken } = generateTokens(user);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// OAuth — вход через Google/GitHub
app.post("/api/auth/oauth", async (req, res) => {
  try {
    const { email, name, provider } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email обязателен" });
    }

    // Ищем существующего пользователя
    let user = await prisma.user.findUnique({
      where: { email },
    });

    // Если нет — создаём
    if (!user) {
      // Генерируем username из email
      const baseUsername = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "");
      let username = baseUsername;
      let counter = 1;

      while (await prisma.user.findUnique({ where: { username } })) {
        username = `${baseUsername}${counter}`;
        counter++;
      }

      // Генерируем случайный пароль (не используется для входа)
      const randomPassword = require("crypto").randomBytes(32).toString("hex");
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = await prisma.user.create({
        data: {
          email,
          name,
          username,
          password: hashedPassword,
        },
      });

      console.log(`✅ Создан OAuth-пользователь: ${email} (${provider})`);
    }

    // Генерируем JWT (как при обычном входе)
    const { accessToken, refreshToken } = generateTokens(user);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// Обновление токена
app.post("/api/auth/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token не предоставлен" });
    }

    // Проверяем refresh token
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);

    // Находим пользователя
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(401).json({ error: "Пользователь не найден" });
    }

    // Генерируем новые токены
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (error) {
    return res.status(401).json({ error: "Недействительный refresh token" });
  }
});
// Список уникальных локаций из публичных резюме
app.get("/api/public/locations", async (req, res) => {
  try {
    const resumes = await prisma.resume.findMany({
      where: {
        status: "public",
        location: { not: "" },
      },
      select: { location: true },
      distinct: ["location"],
      orderBy: { location: "asc" },
    });

    const locations = resumes.map((r) => r.location);

    res.json(locations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// Маппинг сортировки
function getOrderBy(sort) {
  switch (sort) {
    case "oldest":
      return { updatedAt: "asc" };
    case "nameAsc":
      return { fullName: "asc" };
    case "nameDesc":
      return { fullName: "desc" };
    case "newest":
    default:
      return { updatedAt: "desc" };
  }
}

// Публичный список резюме (для каталога)
app.get("/api/public/resumes", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));
    const skip = (page - 1) * limit;
    const search = (req.query.search || "").trim();
    const location = (req.query.location || "").trim();
    const sort = req.query.sort || "newest";

    // Базовый фильтр: только public
    const where = { status: "public" };

    if (search) {
      where.OR = [
        {
          title: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          fullName: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    if (location) {
      where.location = location;
    }
    const [resumes, total] = await Promise.all([
      prisma.resume.findMany({
        where,
        orderBy: getOrderBy(sort),
        skip,
        take: limit,
        include: {
          user: {
            select: { name: true, username: true },
          },
        },
      }),
      prisma.resume.count({ where }),
    ]);

    const parsedResumes = resumes.map((resume) => {
      const personalInfo = JSON.parse(resume.personalInfo);
      const skills = JSON.parse(resume.skills);

      return {
        id: resume.id,
        title: resume.title,
        fullName: personalInfo.fullName || resume.user.name,
        location: personalInfo.location || "",
        summary: personalInfo.summary || "",
        skills: skills.slice(0, 5),
        updatedAt: resume.updatedAt,
        user: {
          name: resume.user.name,
          username: resume.user.username,
        },
      };
    });

    res.json({
      resumes: parsedResumes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// Публичный маршрут для просмотра резюме
app.get("/api/public/resume/:username", async (req, res) => {
  try {
    const { username } = req.params;

    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        resumes: {
          where: {
            status: { in: ["published", "public"] },
          },
          orderBy: { updatedAt: "desc" },
          take: 1,
        },
      },
    });

    if (!user || user.resumes.length === 0) {
      return res.status(404).json({ error: "Резюме не найдено" });
    }

    const resume = user.resumes[0];

    res.json({
      user: {
        name: user.name,
        username: user.username,
      },
      resume: {
        id: resume.id,
        title: resume.title,
        personalInfo: JSON.parse(resume.personalInfo),
        experience: JSON.parse(resume.experience),
        education: JSON.parse(resume.education),
        skills: JSON.parse(resume.skills),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// ============ РЕЗЮМЕ (защищённые маршруты) ============

// Получение всех резюме пользователя
app.get("/api/resumes", authMiddleware, async (req, res) => {
  try {
    const resumes = await prisma.resume.findMany({
      where: { userId: req.userId },
      orderBy: { updatedAt: "desc" },
    });

    const parsedResumes = resumes.map((resume) => ({
      id: resume.id,
      title: resume.title,
      status: resume.status,
      updatedAt: resume.updatedAt,
      createdAt: resume.createdAt,
    }));

    res.json(parsedResumes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// Получение одного резюме
app.get("/api/resumes/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const resume = await prisma.resume.findUnique({
      where: { id },
    });

    if (!resume) {
      return res.status(404).json({ error: "Резюме не найдено" });
    }

    // Проверяем, что резюме принадлежит текущему пользователю
    if (resume.userId !== req.userId) {
      return res.status(403).json({ error: "Доступ запрещён" });
    }

    res.json({
      ...resume,
      status: resume.status,
      personalInfo: JSON.parse(resume.personalInfo),
      experience: JSON.parse(resume.experience),
      education: JSON.parse(resume.education),
      skills: JSON.parse(resume.skills),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// Создание резюме
app.post("/api/resumes", authMiddleware, async (req, res) => {
  try {
    const { title, personalInfo, experience, education, skills, status } =
      req.body;

    const resume = await prisma.resume.create({
      data: {
        title,
        fullName: personalInfo.fullName || "",
        location: personalInfo.location || "",
        personalInfo: JSON.stringify(personalInfo),
        experience: JSON.stringify(experience),
        education: JSON.stringify(education),
        skills: JSON.stringify(skills),
        status: status || "draft",
        userId: req.userId,
      },
    });

    res.json(resume);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});
// Обновление резюме
app.put("/api/resumes/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, personalInfo, experience, education, skills, status } =
      req.body;

    // Проверяем владельца
    const existingResume = await prisma.resume.findUnique({ where: { id } });

    if (!existingResume || existingResume.userId !== req.userId) {
      return res.status(403).json({ error: "Доступ запрещён" });
    }

    const resume = await prisma.resume.update({
      where: { id },
      data: {
        title,
        fullName: personalInfo.fullName || "",
        location: personalInfo.location || "",
        personalInfo: JSON.stringify(personalInfo),
        experience: JSON.stringify(experience),
        education: JSON.stringify(education),
        skills: JSON.stringify(skills),
      },
    });

    res.json(resume);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// Изменение статуса резюме (публикация/снятие с публикации)

app.patch("/api/resumes/:id/publish", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["draft", "published", "public"].includes(status)) {
      return res.status(400).json({ error: "Недопустимый статус" });
    }
    const existingResume = await prisma.resume.findUnique({ where: { id } });

    if (!existingResume || existingResume.userId !== req.userId) {
      return res.status(403).json({ error: "Доступ запрещён" });
    }

    const resume = await prisma.resume.update({
      where: { id },
      data: { status },
    });

    res.json({ id: resume.id, status: resume.status });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// Удаление резюме
app.delete("/api/resumes/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const existingResume = await prisma.resume.findUnique({ where: { id } });

    if (!existingResume || existingResume.userId !== req.userId) {
      return res.status(403).json({ error: "Доступ запрещён" });
    }

    await prisma.resume.delete({ where: { id } });

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// Отправка приглашения на собеседование
app.post("/api/invitations", async (req, res) => {
  try {
    const { resumeId, hrName, hrEmail, message } = req.body;

    if (!resumeId || !hrName || !hrEmail || !message) {
      return res.status(400).json({ error: "Все поля обязательны" });
    }

    // Находим резюме, чтобы убедиться, что оно существует
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
    });

    if (!resume) {
      return res.status(404).json({ error: "Резюме не найдено" });
    }

    // Сохраняем приглашение в базу
    const invitation = await prisma.invitation.create({
      data: {
        hrName,
        hrEmail,
        message,
        resumeId,
      },
    });

    console.log(`📩 Новое приглашение для резюме ${resumeId} от ${hrEmail}`);

    // Отправляем email автору резюме
    try {
      const resumeOwner = await prisma.user.findUnique({
        where: { id: resume.userId },
        select: { email: true, name: true },
      });

      if (resumeOwner && resumeOwner.email) {
        const result = await resend.emails.send({
          from: "Resume Builder <onboarding@resend.dev>",
          to: resumeOwner.email,
          subject: `Новое приглашение на собеседование от ${hrName}`,
          html: `
    <h2>Вас приглашают на собеседование!</h2>
    <p><strong>От кого:</strong> ${hrName} (${hrEmail})</p>
    <p><strong>Резюме:</strong> ${resume.title}</p>
    <p><strong>Сообщение:</strong></p>
    <p>${message}</p>
    <hr />
    <p>Это письмо отправлено автоматически с вашего Resume Builder.</p>
  `,
        });

        // ✅ ВОТ ЗДЕСЬ ПРОВЕРКА
        if (result.error) {
          console.error("❌ Resend вернул ошибку:", result.error);
        } else {
          console.log("✉️ Email реально отправлен, ID:", result.data?.id);
        }
      }
    } catch (emailError) {
      console.error("❌ Ошибка в блоке email:", emailError);
    }

    res.json({ success: true, invitation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// Получение всех приглашений для текущего пользователя
app.get("/api/invitations", authMiddleware, async (req, res) => {
  try {
    // Находим все резюме пользователя
    const resumes = await prisma.resume.findMany({
      where: { userId: req.userId },
      select: { id: true },
    });

    const resumeIds = resumes.map((r) => r.id);

    // Находим все приглашения для этих резюме
    const invitations = await prisma.invitation.findMany({
      where: { resumeId: { in: resumeIds } },
      orderBy: { createdAt: "desc" },
      include: {
        resume: {
          select: { title: true },
        },
      },
    });

    res.json(invitations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

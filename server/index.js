require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const app = express();
const prisma = new PrismaClient();

const JWT_SECRET = "your-secret-key-change-in-production";
const REFRESH_SECRET = "your-refresh-secret-change-in-production";

app.use(cors());
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

// Публичный список резюме (для каталога)
app.get("/api/public/resumes", async (req, res) => {
  try {
    const resumes = await prisma.resume.findMany({
      where: {
        status: "public", // ← Только резюме в каталоге
      },
      orderBy: { updatedAt: "desc" },
      include: {
        user: {
          select: {
            name: true,
            username: true,
          },
        },
      },
    });

    // Парсим JSON-поля и формируем краткие данные для карточек
    const parsedResumes = resumes.map((resume) => {
      const personalInfo = JSON.parse(resume.personalInfo);
      const skills = JSON.parse(resume.skills);

      return {
        id: resume.id,
        title: resume.title,
        // Для карточки — только нужные поля
        fullName: personalInfo.fullName || resume.user.name,
        location: personalInfo.location || "",
        summary: personalInfo.summary || "",
        skills: skills.slice(0, 5), // Первые 5 навыков
        updatedAt: resume.updatedAt,
        user: {
          name: resume.user.name,
          username: resume.user.username,
        },
      };
    });

    res.json(parsedResumes);
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
    const { title, personalInfo, experience, education, skills } = req.body;

    const resume = await prisma.resume.create({
      data: {
        title,
        personalInfo: JSON.stringify(personalInfo),
        experience: JSON.stringify(experience),
        education: JSON.stringify(education),
        skills: JSON.stringify(skills),
        status: "draft",
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
    const { title, personalInfo, experience, education, skills } = req.body;

    // Проверяем владельца
    const existingResume = await prisma.resume.findUnique({ where: { id } });

    if (!existingResume || existingResume.userId !== req.userId) {
      return res.status(403).json({ error: "Доступ запрещён" });
    }

    const resume = await prisma.resume.update({
      where: { id },
      data: {
        title,
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

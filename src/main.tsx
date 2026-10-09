import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { store } from './app/store';
import { router } from './app/router';
import './index.css';
import { ToastProvider } from './components/ui/Toast';


const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
  document.documentElement.classList.add("dark");
} else if (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches) {
  document.documentElement.classList.add("dark");
}
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </Provider>
  </StrictMode>
);
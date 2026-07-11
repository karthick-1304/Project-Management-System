import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from '../pages/Login.jsx';
import Register from '../pages/Register.jsx';
import ForgotPassword from '../pages/ForgotPassword.jsx';
import ResetPassword from '../pages/ResetPassword.jsx';
import Home from '../pages/Home.jsx';
import ProjectsDashboard from '../pages/ProjectsDashboard.jsx';
import ProjectBoard from '../pages/ProjectBoard.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import AppLayout from '../layouts/AppLayout.jsx';

export const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/forgot-password', element: <ForgotPassword /> },
  { path: '/reset-password', element: <ResetPassword /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <Home /> },
          { path: '/projects', element: <ProjectsDashboard /> },
          { path: '/projects/:id', element: <ProjectBoard /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);

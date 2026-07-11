import { createBrowserRouter } from 'react-router-dom';
import Login from '../pages/Login.jsx';
import Register from '../pages/Register.jsx';
import ForgotPassword from '../pages/ForgotPassword.jsx';
import ResetPassword from '../pages/ResetPassword.jsx';
import Home from '../pages/Home.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';

export const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/forgot-password', element: <ForgotPassword /> },
  { path: '/reset-password', element: <ResetPassword /> },
  {
    element: <ProtectedRoute />,
    children: [{ path: '/', element: <Home /> }],
  },
]);

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

NProgress.configure({ showSpinner: false });

export default function RouteProgress() {
  const location = useLocation();

  useEffect(() => {
    NProgress.start();
    const timer = window.setTimeout(() => {
      NProgress.done();
    }, 100);

    return () => {
      window.clearTimeout(timer);
      NProgress.done();
    };
  }, [location.pathname]);

  return null;
}

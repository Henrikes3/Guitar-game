import './style.css';
import { Router } from './ui/router';
import { MenuScreen } from './ui/menuScreen';

const appRoot = document.querySelector<HTMLDivElement>('#app')!;
const router = new Router(appRoot);
router.go((nav) => new MenuScreen(nav));

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => console.warn('Service worker falhou ao registrar', err));
  });
}

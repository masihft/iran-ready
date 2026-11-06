import { initializeApp } from 'firebase/app';
import YouTube from 'react-youtube';

export async function ask(prompt) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', body: prompt });
  return res.json();
}

export default function App() {
  initializeApp({});
  return <YouTube videoId="abc123" />;
}

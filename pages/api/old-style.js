// Старый стиль API маршрутов (pages/api)
export default function handler(req, res) {
  res.status(200).json({ 
    message: 'Old-style API работает!',
    timestamp: new Date().toISOString(),
    path: req.url
  });
}
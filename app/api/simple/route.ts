// API маршрут без импортов
export async function GET() {
  return new Response(
    JSON.stringify({ message: 'Simple API works!' }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}
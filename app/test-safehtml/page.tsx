import SafeHtml from '@/app/_components/ui/SafeHtml';

export default function TestSafeHtml() {
  const htmlTest = `
    <p>Este es un párrafo de prueba con <strong>negrita</strong> y <em>cursiva</em>.</p>
    <h2>Título de nivel 2</h2>
    <p>Un enlace: <a href="https://example.com">Ejemplo</a></p>
    <img src="https://via.placeholder.com/400" alt="Test" style="max-width: 800px; width: 100%; height: auto;" />
  `;

  return (
    <main className="mx-auto max-w-4xl p-8">
      <h1 className="text-3xl font-bold mb-8">Test SafeHtml Component</h1>
      
      <div className="mb-8 p-4 bg-gray-100 rounded">
        <h3 className="font-bold mb-2">HTML Raw:</h3>
        <pre className="text-xs overflow-x-auto">{htmlTest}</pre>
      </div>

      <div className="mb-8 p-4 border rounded">
        <h3 className="font-bold mb-4">Rendered with SafeHtml:</h3>
        <SafeHtml html={htmlTest} />
      </div>
    </main>
  );
}

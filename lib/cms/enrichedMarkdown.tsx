import ReactMarkdown from 'react-markdown';

type BlockType = 'callout' | 'grid-2' | 'grid-3' | 'buttons' | 'card' | 'markdown';

type Block = {
  type: BlockType;
  content: string;
};

// Parser simple: divide contenido en bloques
export function parseEnrichedMarkdown(content: string): Block[] {
  const blocks: Block[] = [];
  const regex = /:::(callout|grid-2|grid-3|buttons|card)\n([\s\S]*?):::/g;
  
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    // Contenido markdown antes del bloque
    if (match.index > lastIndex) {
      const mdContent = content.substring(lastIndex, match.index).trim();
      if (mdContent) {
        blocks.push({ type: 'markdown', content: mdContent });
      }
    }

    // El bloque custom
    blocks.push({
      type: match[1] as BlockType,
      content: match[2].trim(),
    });

    lastIndex = match.index + match[0].length;
  }

  // Contenido markdown después del último bloque
  if (lastIndex < content.length) {
    const mdContent = content.substring(lastIndex).trim();
    if (mdContent) {
      blocks.push({ type: 'markdown', content: mdContent });
    }
  }

  // Si no hay bloques, todo es markdown
  if (blocks.length === 0 && content.trim()) {
    blocks.push({ type: 'markdown', content: content.trim() });
  }

  return blocks;
}

// Callout: caja destacada
function CalloutBlock({ content }: { content: string }) {
  return (
    <div className="my-8 rounded-lg border-l-4 border-blue-600 bg-blue-50 p-6">
      <div className="prose prose-lg max-w-none">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );
}

// Grid item para grid-2 y grid-3
type GridItem = {
  image?: string;
  title: string;
  text: string;
  link?: string;
};

function parseGridItems(content: string): GridItem[] {
  const items: GridItem[] = [];
  const itemBlocks = content.split('---').map(s => s.trim()).filter(Boolean);

  for (const block of itemBlocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    const item: GridItem = { title: '', text: '' };

    for (const line of lines) {
      if (line.startsWith('imagen:')) {
        item.image = line.replace('imagen:', '').trim();
      } else if (line.startsWith('titulo:')) {
        item.title = line.replace('titulo:', '').trim();
      } else if (line.startsWith('link:')) {
        item.link = line.replace('link:', '').trim();
      } else if (line.startsWith('texto:')) {
        item.text = line.replace('texto:', '').trim();
      } else if (!line.includes(':')) {
        // Línea sin prefijo, es continuación del texto
        item.text += (item.text ? ' ' : '') + line;
      }
    }

    if (item.title) {
      items.push(item);
    }
  }

  return items;
}

function GridBlock({ content, cols }: { content: string; cols: 2 | 3 }) {
  const items = parseGridItems(content);

  const gridCols = cols === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3';

  return (
    <div className={`my-8 grid gap-6 grid-cols-1 ${gridCols}`}>
      {items.map((item, idx) => (
        <div
          key={idx}
          className="rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-lg"
        >
          {item.image && item.image.trim() && (
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-lg bg-gray-100 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.image.trim()}
                alt={item.title}
                className="h-full w-full object-contain"
              />
            </div>
          )}
          
          <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
          
          {item.text && (
            <p className="text-gray-600 leading-relaxed mb-4">{item.text}</p>
          )}
          
          {item.link && item.link.trim() && (
            <a
              href={item.link.trim()}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              Más información →
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

// Buttons: lista de botones
type ButtonItem = {
  text: string;
  link: string;
};

function parseButtons(content: string): ButtonItem[] {
  const buttons: ButtonItem[] = [];
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);

  for (const line of lines) {
    const match = line.match(/\[(.*?)\]\((.*?)\)/);
    if (match) {
      buttons.push({ text: match[1], link: match[2] });
    }
  }

  return buttons;
}

function ButtonsBlock({ content }: { content: string }) {
  const buttons = parseButtons(content);

  return (
    <div className="my-8 flex flex-wrap gap-4">
      {buttons.map((btn, idx) => (
        <a
          key={idx}
          href={btn.link}
          className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          {btn.text}
        </a>
      ))}
    </div>
  );
}

// Card: tarjeta simple
function CardBlock({ content }: { content: string }) {
  return (
    <div className="my-8 rounded-lg border border-gray-200 bg-white p-8">
      <div className="prose prose-lg max-w-none">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );
}

// Renderer principal
export function EnrichedMarkdown({ content }: { content: string }) {
  const blocks = parseEnrichedMarkdown(content);

  return (
    <>
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'callout':
            return <CalloutBlock key={idx} content={block.content} />;
          
          case 'grid-2':
            return <GridBlock key={idx} content={block.content} cols={2} />;
          
          case 'grid-3':
            return <GridBlock key={idx} content={block.content} cols={3} />;
          
          case 'buttons':
            return <ButtonsBlock key={idx} content={block.content} />;
          
          case 'card':
            return <CardBlock key={idx} content={block.content} />;
          
          case 'markdown':
          default:
            return (
              <div key={idx} className="prose prose-lg max-w-none">
                <ReactMarkdown>{block.content}</ReactMarkdown>
              </div>
            );
        }
      })}
    </>
  );
}

// app/albums/[id]/page.tsx
import { albums, works } from '@/app/data/works';
import { notFound } from 'next/navigation';
import Image from 'next/image';

export default function AlbumPage({ params }: { params: { id: string } }) {
  const album = albums.find((a) => a.id === params.id);
  if (!album) return notFound();

  const albumWorks = works.filter((w) => w.albumId === params.id);

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold">{album.name}</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
        {albumWorks.map((work) => (
          <div key={work.id} className="border p-2">
            <Image
              src={work.src}
              alt={work.title}
              width={400}
              height={400}
              className="w-full h-48 object-cover"
            />
            <p className="text-sm mt-1">{work.title} ({work.year})</p>
          </div>
        ))}
      </div>
    </main>
  );
}
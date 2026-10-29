import { albums, works } from '@/app/data/works';
import { notFound } from 'next/navigation';
import Image from 'next/image';

export default async function AlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const album = albums.find((a) => a.id === id);
  if (!album) return notFound();

  const albumWorks = works.filter((w) => w.albumId === id);

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
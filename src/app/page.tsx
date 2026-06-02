import { Quiz } from '@/components/Quiz';

export default function Home() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-xl">
        <Quiz />
      </div>
    </main>
  );
}

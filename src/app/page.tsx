import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle2, BarChart2, Users, Calendar, CheckSquare } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <span className="text-primary-foreground font-bold">A</span>
            </div>
            <span className="text-xl font-bold">Klon Asany</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login" className="text-sm font-medium hover:underline">
              Zaloguj się
            </Link>
            <Button asChild>
              <Link href="/register">Zarejestruj się za darmo</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-5xl text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Pracuj nad wielkimi pomysłami, bez zbędnej pracy
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Od małych rzeczy po duży obraz, zorganizuj pracę swojego zespołu za pomocą naszego klona Asany
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/register">Zacznij za darmo</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">Zaloguj się</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Dlaczego warto wybrać naszą platformę?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-card p-6 rounded-lg shadow-sm">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <CheckSquare className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Zarządzanie zadaniami</h3>
                <p className="text-muted-foreground">
                  Twórz, przypisuj i śledź zadania z łatwością. Ustawiaj priorytety i terminy, aby dotrzymać harmonogramu.
                </p>
              </div>
              <div className="bg-card p-6 rounded-lg shadow-sm">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Współpraca zespołowa</h3>
                <p className="text-muted-foreground">
                  Pracujcie razem bezproblemowo dzięki komentarzom, wzmiankom i aktualizacjom w czasie rzeczywistym.
                </p>
              </div>
              <div className="bg-card p-6 rounded-lg shadow-sm">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Wiele widoków</h3>
                <p className="text-muted-foreground">
                  Wizualizuj swoją pracę za pomocą widoków listy, tablicy i kalendarza, aby dopasować je do swojego przepływu pracy.
                </p>
              </div>
              <div className="bg-card p-6 rounded-lg shadow-sm">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <BarChart2 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Śledzenie postępów</h3>
                <p className="text-muted-foreground">
                  Monitoruj postępy projektu i wydajność zespołu dzięki szczegółowym raportom i wglądom.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold mb-6">Gotowy, aby zacząć?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Dołącz do tysięcy zespołów, które już korzystają z naszej platformy do zarządzania swoją pracą
            </p>
            <Button size="lg" asChild>
              <Link href="/register">Zarejestruj się za darmo</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xs">A</span>
              </div>
              <span className="text-sm font-semibold">Klon Asany</span>
            </div>
            <div className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Klon Asany. Wszelkie prawa zastrzeżone.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
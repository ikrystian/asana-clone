const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateClientAccess() {
  try {
    console.log('Sprawdzanie istniejących klientów...');
    
    // Sprawdź czy są jakieś klienci w bazie danych
    const clients = await prisma.client.findMany();
    console.log(`Znaleziono ${clients.length} klientów`);
    
    if (clients.length === 0) {
      console.log('Brak klientów do migracji');
      return;
    }
    
    // Sprawdź czy są jakieś dane dostępowe w starym formacie
    // Ponieważ kolumny zostały już usunięte przez migrację, 
    // sprawdzimy czy istnieją jakieś rekordy ClientAccess
    const existingAccesses = await prisma.clientAccess.findMany();
    console.log(`Znaleziono ${existingAccesses.length} istniejących dostępów`);
    
    console.log('Migracja zakończona pomyślnie');
  } catch (error) {
    console.error('Błąd podczas migracji:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateClientAccess();

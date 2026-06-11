// C:\Users\vagee\Desktop\CRM\crm-backend\seed.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune'];
const products = ['Cotton T-Shirt', 'Denim Jeans', 'Leather Jacket', 'Running Shoes', 'Sunglasses', 'Wrist Watch', 'Summer Dress'];
const channels = ['web', 'app', 'store'];

const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomAmount = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

async function main() {
  console.log('Seeding data...');
  await prisma.communication.deleteMany({});
  await prisma.campaign.deleteMany({});
  await prisma.segment.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.customer.deleteMany({});

  const customers = [];

  for (let i = 1; i <= 50; i++) {
    const purchaseCount = randomAmount(1, 10);
    let totalSpend = 0;
    let lastPurchaseDate = new Date('2020-01-01');

    customers.push({
      name: `Customer ${i}`,
      email: `customer${i}@example.com`,
      phone: `+9198765${String(i).padStart(5, '0')}`,
      city: randomItem(cities),
      total_spend: 0, // will calculate later
      last_purchase_date: new Date(),
      purchase_count: purchaseCount,
      created_at: randomDate(new Date('2023-01-01'), new Date('2024-01-01')),
    });
  }

  const createdCustomers = await prisma.customer.createManyAndReturn({ data: customers });

  const orders = [];
  for (const customer of createdCustomers) {
    let customerTotalSpend = 0;
    let latestDate = new Date('2020-01-01');

    for (let j = 0; j < customer.purchase_count; j++) {
      const amount = randomAmount(500, 5000);
      customerTotalSpend += amount;
      const orderDate = randomDate(new Date('2023-01-01'), new Date());
      if (orderDate > latestDate) latestDate = orderDate;

      orders.push({
        customer_id: customer.id,
        amount,
        product_name: randomItem(products),
        channel: randomItem(channels),
        created_at: orderDate,
      });
    }

    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        total_spend: customerTotalSpend,
        last_purchase_date: latestDate,
      }
    });
  }

  await prisma.order.createMany({ data: orders });

  console.log(`Seeded 50 customers and ${orders.length} orders.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

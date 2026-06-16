import { PrismaClient } from '@prisma/client';
import { DEFAULT_MONTHLY_PRICE, DEFAULT_TRIAL_DAYS, DEFAULT_YEARLY_PRICE } from '../lib/constants';

const prisma = new PrismaClient();

async function upsertSetting(key: string, value: string) {
  await prisma.setting.upsert({
    where: { key },
    update: {},
    create: { key, value },
  });
}

async function main() {
  await prisma.plan.upsert({
    where: { id: 'default-trial-plan' },
    update: {},
    create: {
      id: 'default-trial-plan',
      name: 'Trial Plan',
      type: 'trial',
      billingType: null,
      price: 0,
      durationDays: DEFAULT_TRIAL_DAYS,
      isActive: true,
    },
  });

  await prisma.plan.upsert({
    where: { id: 'default-pro-monthly' },
    update: {},
    create: {
      id: 'default-pro-monthly',
      name: 'Pro Monthly',
      type: 'pro',
      billingType: 'monthly',
      price: DEFAULT_MONTHLY_PRICE,
      isActive: true,
    },
  });

  await prisma.plan.upsert({
    where: { id: 'default-pro-yearly' },
    update: {},
    create: {
      id: 'default-pro-yearly',
      name: 'Pro Yearly',
      type: 'pro',
      billingType: 'yearly',
      price: DEFAULT_YEARLY_PRICE,
      isActive: true,
    },
  });

  await Promise.all([
    upsertSetting('trial_days', String(DEFAULT_TRIAL_DAYS)),
    upsertSetting('monthly_price', String(DEFAULT_MONTHLY_PRICE)),
    upsertSetting('yearly_price', String(DEFAULT_YEARLY_PRICE)),
  ]);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

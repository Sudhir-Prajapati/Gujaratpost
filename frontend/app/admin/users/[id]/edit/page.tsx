'use client';

import { use } from 'react';
import UserForm from '@/components/sections/UserForm';

interface EditUserPageProps {
  params: Promise<{ id: string }>;
}

export default function EditUserPage({ params }: EditUserPageProps) {
  const { id } = use(params);
  return <UserForm userId={id} />;
}

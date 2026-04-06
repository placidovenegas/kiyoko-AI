import { redirect } from 'next/navigation';

export default function NewTaskAliasPage() {
  redirect('/dashboard/tasks/new');
}
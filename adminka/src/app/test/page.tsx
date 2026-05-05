import { redirect } from 'next/navigation';

export default function TestPageRedirect() {
    redirect('/new_test');
}

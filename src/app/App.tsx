import { RouterProvider } from 'react-router';
import { Toaster } from 'sonner';
import { UserProvider } from './context/user-context';
import { ScrapProvider } from './context/scrap-context';
import { router } from './routes';

export default function App() {
  return (
    <UserProvider>
      <ScrapProvider>
        <RouterProvider router={router} />
        <Toaster
          position="bottom-center"
          offset={80}
          toastOptions={{
            unstyled: true,
            classNames: {
              toast:
                'bg-[#2A251E] border border-[rgba(115,111,114,0.25)] rounded-xl px-4 py-3 shadow-2xl flex items-center gap-3 w-full max-w-sm',
              title: 'text-sm text-[#E8E2D9]',
              description: 'text-xs text-[#736f72]',
              actionButton:
                'text-xs font-medium text-[#4A7C59] hover:text-[#5A8C69] transition-colors whitespace-nowrap ml-auto',
            },
          }}
        />
      </ScrapProvider>
    </UserProvider>
  );
}

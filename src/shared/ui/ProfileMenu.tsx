// ProfileMenu.tsx
import { Menu, Transition, MenuButton, MenuItems, MenuItem } from '@headlessui/react'
import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import avatar from '@/assets/avatars/scrooge.jpg'

type Props = {
  onLogout?: () => void;
}

export default function ProfileMenu({ onLogout }: Props) {
  return (
    <Menu as="div" className="relative inline-block text-left">
      {/* Кнопка = аватар */}
      <MenuButton className="cursor-pointer">
        <div className="w-9 rounded-full overflow-hidden">
          {avatar
            ? <img src={avatar} alt='You' />
            : <div className="grid place-items-center w-full h-full bg-base-200 text-xs">You</div>}
        </div>
      </MenuButton>

      {/* Выпадающее меню */}
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100 transform"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="transition ease-in duration-75 transform"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <MenuItems className="absolute right-0 w-56 top-16 mt-1 rounded-xl bg-base-100 dark:bg-gray-800 dark:text-gray-300 shadow ring-1 ring-black/5 focus:outline-none z-50">
          <div className="p-2">
            <MenuItem as={Link} to="/settings" className="block rounded-lg px-3 py-2 data-[focus]:bg-base-200">
              Profile Settings
            </MenuItem>
            <MenuItem as={Link} to="/avatars" className="block rounded-lg px-3 py-2 data-[focus]:bg-base-200">
              Bill History
            </MenuItem>
            <div className="my-2 h-px bg-base-200" />
            <MenuItem as="button" onClick={onLogout} className="w-full text-left rounded-lg px-3 py-2 text-error data-[focus]:bg-base-200">
              Logout
            </MenuItem>
          </div>
        </MenuItems>
      </Transition>
    </Menu>
  )
}

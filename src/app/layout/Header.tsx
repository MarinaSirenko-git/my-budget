import ScenarioSwitch from '@/shared/ui/ScenarioSwitch';
import MobileMenu from '@/shared/ui/MobileMenu';
import ThemeSwitch from '@/shared/ui/ThemeSwitch';
import PlaceName from '@/shared/ui/PlaceName';

function Header(){

    return(
        <>
            <div className="navbar sticky top-0 font-normal font-base bg-sidebarBg border-b dark:border-borderColor dark:bg-sidebarBg z-20 shadow-xs flex items-center justify-between py-4 pl-4 pr-4">
                <div className="flex items-center gap-4 w-full">
                    <MobileMenu />
                    <div className="flex items-center justify-between gap-4 w-full">
                        <div className="flex items-center gap-4">
                            <PlaceName />
                            <ScenarioSwitch />
                        </div>
                        <div className="flex items-center gap-4">
                            <ThemeSwitch />
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Header
import PageContent from './PageContent'
import LeftSidebar from './LeftSidebar'

function Layout(){
    return(
      <>
        <LeftSidebar />
        <div className="min-h-screen flex flex-col md:pl-[clamp(200px,18vw,260px)]">
          <PageContent/>
        </div>
      </>
    )
}

export default Layout
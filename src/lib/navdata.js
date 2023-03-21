

import HomeFillIcon from 'remixicon-react/HomeFillIcon';
import FileListFillIcon from 'remixicon-react/FileListFillIcon';
import BarChartFillIcon from 'remixicon-react/BarChartFillIcon';
import SettingsFillIcon from 'remixicon-react/SettingsFillIcon';
import GalleryFillIcon from 'remixicon-react/GalleryFillIcon';
import UserFillIcon from 'remixicon-react/UserFillIcon';

import ReactjsFillIcon from 'remixicon-react/ReactjsFillIcon';

export const navData = [
    {
        id: 0,
        icon: <HomeFillIcon/>,
        text: "Home",
        link: "/"
    },
    {
        id: 1,
        icon: <UserFillIcon />,
        text: "Users",
        link: "users"
    },
    {
        id: 2,
        icon: <GalleryFillIcon />,
        text: "Libraries",
        link: "libraries"
    },
    {
        id: 4,
        icon: <ReactjsFillIcon />,
        text: "Component Testing Playground",
        link: "testing"
    },
    {
        id: 5,
        icon: <SettingsFillIcon />,
        text: "Settings",
        link: "settings"
    }

]
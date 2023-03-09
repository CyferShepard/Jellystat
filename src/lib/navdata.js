

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
        icon: <FileListFillIcon />,
        text: "Activity",
        link: "activity"
    },
    {
        id: 2,
        icon: <GalleryFillIcon />,
        text: "Libraries",
        link: "libraries"
    }    ,
    {
        id: 3,
        icon: <UserFillIcon />,
        text: "Recently Played",
        link: "recent"
    },
    {
        id: 4,
        icon: <BarChartFillIcon />,
        text: "User Activity",
        link: "usersactivity"
    },
    {
        id: 5,
        icon: <ReactjsFillIcon />,
        text: "Library Data",
        link: "userdata"
    },
    {
        id: 6,
        icon: <SettingsFillIcon />,
        text: "Settings",
        link: "settings"
    }

]
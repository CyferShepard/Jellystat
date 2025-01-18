

import HomeFillIcon from 'remixicon-react/HomeFillIcon';
import BarChartFillIcon from 'remixicon-react/BarChartFillIcon';
import HistoryFillIcon from 'remixicon-react/HistoryFillIcon';
import SettingsFillIcon from 'remixicon-react/SettingsFillIcon';
import GalleryFillIcon from 'remixicon-react/GalleryFillIcon';
import UserFillIcon from 'remixicon-react/UserFillIcon';
import InformationFillIcon from 'remixicon-react/InformationFillIcon';
import { Trans } from 'react-i18next';


export const navData = [
    {
        id: 0,
        icon: <HomeFillIcon/>,
        text: <Trans i18nKey="MENU_TABS.HOME" />,
        link: ""
    },
    {
        id: 1,
        icon: <GalleryFillIcon />,
        text: <Trans i18nKey="MENU_TABS.LIBRARIES" />,
        link: "libraries"
    },
    {
        id: 2,
        icon: <UserFillIcon />,
        text: <Trans i18nKey="MENU_TABS.USERS" />,
        link: "users"
    },
    {
        id: 4,
        icon: <HistoryFillIcon />,
        text: <Trans i18nKey="MENU_TABS.ACTIVITY" />,
        link: "activity"
    },
    {
        id: 5,
        icon: <BarChartFillIcon />,
        text: <Trans i18nKey="MENU_TABS.STATISTICS" />,
        link: "statistics"
    },

    {
        id: 6,
        icon: <SettingsFillIcon />,
        text: <Trans i18nKey="MENU_TABS.SETTINGS" />,
        link: "settings"
    }
    ,

    {
        id: 7,
        icon: <InformationFillIcon />,
        text: <Trans i18nKey="MENU_TABS.ABOUT" />,
        link: "about"
    }

]


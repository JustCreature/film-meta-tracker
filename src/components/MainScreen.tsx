import React, { useState } from 'react';
import {
    Box,
    Tabs,
    Tab,
    AppBar,
    Toolbar,
    Typography,
    IconButton
} from '@mui/material';
import {
    PhotoLibrary,
    CameraAlt,
    Settings
} from '@mui/icons-material';
import type { FilmRoll, Exposure, Camera } from '../types';
import { FilmRollListScreen } from './FilmRollListScreen';
import { CameraManagementScreen } from './CameraManagementScreen';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`tabpanel-${index}`}
            aria-labelledby={`tab-${index}`}
            {...other}
        >
            {value === index && children}
        </div>
    );
}

interface MainScreenProps {
    filmRolls: FilmRoll[];
    cameras: Camera[];
    exposures: Exposure[];
    onFilmRollSelected: (filmRoll: FilmRoll) => void;
    onFilmRollCreated: (filmRoll: FilmRoll) => void;
    onFilmRollDeleted: (filmRollId: string) => void;
    onCameraCreated: (camera: Camera) => void;
    onCameraUpdated: (camera: Camera) => void;
    onCameraDeleted: (cameraId: string) => void;
    onSettingsClick?: () => void;
}

export const MainScreen: React.FC<MainScreenProps> = ({
    filmRolls,
    cameras,
    exposures,
    onFilmRollSelected,
    onFilmRollCreated,
    onFilmRollDeleted,
    onCameraCreated,
    onCameraUpdated,
    onCameraDeleted,
    onSettingsClick
}) => {
    const [currentTab, setCurrentTab] = useState(0);

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setCurrentTab(newValue);
    };

    return (
        <Box sx={{ flexGrow: 1, bgcolor: 'background.default', minHeight: '100vh' }}>
            <AppBar position="static" elevation={1}>
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        Film Photography Tracker
                    </Typography>
                    {onSettingsClick && (
                        <IconButton
                            color="inherit"
                            onClick={onSettingsClick}
                            aria-label="settings"
                        >
                            <Settings />
                        </IconButton>
                    )}
                </Toolbar>
                <Tabs
                    value={currentTab}
                    onChange={handleTabChange}
                    sx={{
                        bgcolor: 'primary.dark',
                        '& .MuiTab-root': {
                            color: 'rgba(255, 255, 255, 0.7)',
                            '&.Mui-selected': { color: 'white' }
                        },
                        '& .MuiTabs-indicator': {
                            backgroundColor: 'white'
                        }
                    }}
                >
                    <Tab
                        icon={<PhotoLibrary />}
                        label="Film Rolls"
                        iconPosition="start"
                        sx={{ minHeight: 48 }}
                    />
                    <Tab
                        icon={<CameraAlt />}
                        label="Cameras"
                        iconPosition="start"
                        sx={{ minHeight: 48 }}
                    />
                </Tabs>
            </AppBar>

            <TabPanel value={currentTab} index={0}>
                <FilmRollListScreen
                    filmRolls={filmRolls}
                    cameras={cameras}
                    exposures={exposures}
                    onFilmRollSelected={onFilmRollSelected}
                    onFilmRollCreated={onFilmRollCreated}
                    onFilmRollDeleted={onFilmRollDeleted}
                />
            </TabPanel>

            <TabPanel value={currentTab} index={1}>
                <CameraManagementScreen
                    cameras={cameras}
                    onCameraCreated={onCameraCreated}
                    onCameraUpdated={onCameraUpdated}
                    onCameraDeleted={onCameraDeleted}
                />
            </TabPanel>
        </Box>
    );
};
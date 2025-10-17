import React from 'react';
import {
    Card,
    CardMedia,
    CardContent,
    Typography,
    Box,
    Chip,
    Stack
} from '@mui/material';

interface ItemCardProps {
    id: string;
    title: string;
    subtitle?: string;
    image?: string;
    metadata?: Array<{
        label: string;
        value: string;
        icon?: React.ReactNode;
    }>;
    tags?: Array<{
        label: string;
        color?: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
    }>;
    onClick?: (id: string) => void;
    height?: string | number;
    imageHeight?: string | number;
}

export const ItemCard: React.FC<ItemCardProps> = ({
    id,
    title,
    subtitle,
    image,
    metadata = [],
    tags = [],
    onClick,
    height = 'auto',
    imageHeight = 140
}) => {
    const handleClick = () => {
        if (onClick) {
            onClick(id);
        }
    };

    return (
        <Card
            sx={{
                height,
                display: 'flex',
                flexDirection: 'column',
                cursor: onClick ? 'pointer' : 'default',
                transition: 'all 0.2s ease-in-out',
                '&:hover': onClick ? {
                    transform: 'translateY(-2px)',
                    boxShadow: 4,
                } : {},
            }}
            onClick={handleClick}
        >
            {image && (
                <CardMedia
                    component="img"
                    height={imageHeight}
                    image={image}
                    alt={title}
                    sx={{
                        objectFit: 'cover',
                        backgroundColor: '#f5f5f5'
                    }}
                />
            )}

            <CardContent sx={{ flex: 1, p: 2 }}>
                <Typography
                    variant="h6"
                    component="div"
                    sx={{
                        mb: 1,
                        fontSize: '1rem',
                        fontWeight: 500,
                        lineHeight: 1.2
                    }}
                >
                    {title}
                </Typography>

                {subtitle && (
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1.5 }}
                    >
                        {subtitle}
                    </Typography>
                )}

                {metadata.length > 0 && (
                    <Stack spacing={1} sx={{ mb: 1.5 }}>
                        {metadata.map((item, index) => (
                            <Box
                                key={index}
                                display="flex"
                                alignItems="center"
                                gap={1}
                            >
                                {item.icon}
                                <Typography variant="caption" color="text.secondary">
                                    {item.label}:
                                </Typography>
                                <Typography variant="caption">
                                    {item.value}
                                </Typography>
                            </Box>
                        ))}
                    </Stack>
                )}

                {tags.length > 0 && (
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                        {tags.map((tag, index) => (
                            <Chip
                                key={index}
                                label={tag.label}
                                size="small"
                                color={tag.color || 'default'}
                                variant="outlined"
                            />
                        ))}
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};
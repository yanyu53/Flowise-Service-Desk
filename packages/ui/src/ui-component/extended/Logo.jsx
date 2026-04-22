import { useSelector } from 'react-redux'
import { Typography } from '@mui/material'

// ==============================|| LOGO ||============================== //

const Logo = () => {
    const customization = useSelector((state) => state.customization)

    return (
        <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'row', marginLeft: '10px' }}>
            <Typography
                variant='h4'
                sx={{
                    fontWeight: 700,
                    letterSpacing: 0.2,
                    color: customization.isDarkMode ? 'white' : 'inherit',
                    lineHeight: 1
                }}
            >
                服务台
            </Typography>
        </div>
    )
}

export default Logo

import MainCard from '@/ui-component/cards/MainCard'
import { Box, Stack, Typography } from '@mui/material'
import unauthorizedSVG from '@/assets/images/unauthorized.svg'
import { StyledButton } from '@/ui-component/button/StyledButton'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'

// ==============================|| UnauthorizedPage ||============================== //

const UnauthorizedPage = () => {
    const currentUser = useSelector((state) => state.auth.user)

    return (
        <>
            <MainCard>
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: 'calc(100vh - 210px)'
                    }}
                >
                    <Stack
                        sx={{
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        flexDirection='column'
                    >
                        <Box sx={{ p: 2, height: 'auto' }}>
                            <img
                                style={{ objectFit: 'cover', height: '20vh', width: 'auto' }}
                                src={unauthorizedSVG}
                                alt='unauthorizedSVG'
                            />
                        </Box>
                        <Typography sx={{ mb: 2 }} variant='h4' component='div' fontWeight='bold'>
                            403 Forbidden
                        </Typography>
                        <Typography variant='body1' component='div' sx={{ mb: 2 }}>
                            你没有权限访问此页面。
                        </Typography>
                        {currentUser ? (
                            <Link to='/support/workbench'>
                                <StyledButton sx={{ px: 2, py: 1 }}>返回首页</StyledButton>
                            </Link>
                        ) : (
                            <Link to='/login'>
                                <StyledButton sx={{ px: 2, py: 1 }}>返回登录页</StyledButton>
                            </Link>
                        )}
                    </Stack>
                </Box>
            </MainCard>
        </>
    )
}

export default UnauthorizedPage

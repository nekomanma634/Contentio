import Typography from "@mui/material/Typography"

const home = () => {
    return (
        <div>
            <Typography variant="h1" align="left" fontFamily={'Note Serif JP'} sx={{letterSpacing: '0.05em'}}>
                Home
            </Typography>

            <Typography variant="body1" align="left" fontSize={30} fontFamily={'Note Serif JP'}>
                This is Home!!
            </Typography>
        </div>
    );
};

export default home;
import { Alert, Box, Button, Snackbar, Stack, TextField, Typography } from "@mui/material";
import type { InputRoomFrom } from "../types/room";
import { useState } from "react";
import type { BackendAddr } from "../types/addr";

const MakeRoom = ({backendAddr}: BackendAddr) => {
    const [inputData, setInputData] = useState<InputRoomFrom>({
        maxPlayer: 2,
        name:      '',
        owner:     '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        setInputData((prev) => ({
            ...prev,
            [name]: name === 'maxPlayer' ? Number(value) : value,
        }))
    }

    const [open, setOpen] = useState(false);
    
    // 送信ボタンを押したときの処理
    const handleSubmit = async () => {
        try {
            const response = await fetch(backendAddr+'/rooms',{
                method: 'post',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(inputData),
            });

            if(response.ok){
                const result = await response.json();
                console.log('Server response:', result);

                setOpen(true);
                setInputData({ name: '', maxPlayer: 2, owner: '' }); // 初期化
            }else{
                alert('通信に失敗しました');
            }
        }catch(error){
            console.error('通信エラー:', error);
            alert('通信エラー');
        }
    }

    const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway'){
            return;
        }

        setOpen(false);
    }

    return(
        <div>
            <Typography variant="h1" align="left" fontFamily={'Note Serif JP'} gutterBottom >
                Room Make
            </Typography>

            <Typography variant="body1" align="left" fontFamily={'Note Serif JP'} gutterBottom>
                ルームを作成します.<br/>
                任意のルーム名,ユーザーネーム,最大人数を指定してください.<p/>
            </Typography>

            <Box sx={{maxWidth: 600, mx:'auto', p:3, border: '1px solid #ccc', borderRadius: 2}}>
                <Typography variant="h6" gutterBottom>
                    ルーム作成
                </Typography>

                <Stack spacing={3}>
                    <TextField
                        label    = 'ルーム名'
                        name     = 'name'
                        value    = {inputData.name}
                        onChange = {handleChange}
                        fullWidth
                        required
                        sx={{label: {color:'white'},
                            input: { color: 'white' },
                            '& .MuiOutlinedInput-root': {
                                '& fieldset'            : { borderColor: 'white' },
                                '&:hover fieldset'      : { borderColor: 'white' },
                                '&.Mui-focused fieldset': { borderColor: 'white' }}}}/>

                    <TextField 
                        fullWidth
                        label      = '作成者'
                        name       = 'owner'
                        value      = {inputData.owner}
                        onChange   = {handleChange}
                        helperText ="あなたのユーザーネームを入力してください"
                        slotProps  ={{
                            formHelperText:{sx:{color:'white'}}}}
                        sx={{label: {color:'white'},
                            input: { color: 'white' },
                            '& .MuiOutlinedInput-root': {
                                '& fieldset'            : { borderColor: 'white' },
                                '&:hover fieldset'      : { borderColor: 'white' },
                                '&.Mui-focused fieldset': { borderColor: 'white' }}}}/>

                    <TextField
                        fullWidth
                        label     = '最大人数'
                        name      = 'maxPlayer'
                        type      = 'number'
                        value     = {inputData.maxPlayer}
                        onChange  = {handleChange}
                        slotProps = {{ htmlInput: {min: 2, max: 20} }}
                        sx={{label: {color:'white'},
                            input: { color: 'white' },
                            '& .MuiOutlinedInput-root': {
                                '& fieldset'            : { borderColor: 'white' },
                                '&:hover fieldset'      : { borderColor: 'white' },
                                '&.Mui-focused fieldset': { borderColor: 'white' }}}}/>

                    <Button variant="contained" onClick={handleSubmit}>
                        送信
                    </Button>
                </Stack>

                <Snackbar
                    open={open}
                    autoHideDuration={3000}
                    onClose={handleClose}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center'}}>

                    <Alert onClick={handleClose} severity="success" sx={{width: '100%'}}>
                        ルーム{inputData.name}を作成します
                    </Alert>

                </Snackbar>

            </Box>
        </div>
    )
}

export default MakeRoom;
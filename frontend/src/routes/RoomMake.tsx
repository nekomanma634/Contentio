import { Box, Button, Stack, TextField, Typography } from "@mui/material";
import type { InputRoomFrom } from "../types/room";
import { useState } from "react";

const MakeRoom = () => {
    const [inputData, setInputData] = useState<InputRoomFrom>({
        maxPlayer: 2,
        name:      '',
        owner:     '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        setInputData((prev) => ({
            ...prev,
            [name]: name === 'MaxPlayer' ? Number(value) : value,
        }))
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

                    <Button variant="contained">送信</Button>
                </Stack>

            </Box>
        </div>
    )
}

export default MakeRoom;
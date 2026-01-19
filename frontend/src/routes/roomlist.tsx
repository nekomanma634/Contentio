import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import Typography    from '@mui/material/Typography'
import type { Room } from '../types/room';

const RoomList = () => {
    // テストデータ
    const rooms: Room[] = [
        { id: 1, name: 'Test room', owner: 'nekomanma634', nowPlayer: 0, maxPlayer: 10 }
    ]

    return (
        <div>
            <Typography variant="h1" align="left" fontFamily={'Note Serif JP'} gutterBottom>
                Room List
            </Typography>

            <Typography variant="body1" align="left" fontFamily={'Note Serif JP'} gutterBottom>
                現在作成されているルームです.
            </Typography>

            <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="room table">

                    <TableHead>
                        <TableRow>
                            <TableCell>名前</TableCell>
                            <TableCell align="right" >作成者</TableCell>
                            <TableCell align="right" >人数  </TableCell>
                            <TableCell align="center">番号  </TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {rooms.map((room) => (
                            <TableRow key={room.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                <TableCell component="th" scope="row"> {room.name }                     </TableCell>
                                <TableCell align="right">              {room.owner}                     </TableCell>
                                <TableCell align="right">              {room.nowPlayer}/{room.maxPlayer}</TableCell>
                                <TableCell align="center">             {room.id   }                     </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>

                </Table>
            </TableContainer>

        </div>
    );
}

export default RoomList;
import { Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import Typography    from '@mui/material/Typography'
import type { Room } from '../types/room';
import { useEffect, useState } from "react";
import type { BackendAddr } from "../types/addr";

const RoomList = ({backendAddr}: BackendAddr) => {
    const [rooms, setRooms] = useState<Room[]>([])

    useEffect(() => {
        // rust鯖のURL
        fetch(backendAddr+'/rooms')
            .then((res) => res.json())
            .then((data) => {
                console.log("取得したデータ:", data)
                setRooms(data);
            })
            .catch((error) => {
                console.error("エラーが発生しました:", error);
            });
    }, [])

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
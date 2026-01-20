import Typography from "@mui/material/Typography"

const home = () => {
    return (
        <div>
            <Typography variant="h1" align="left" fontFamily={'Note Serif JP'} gutterBottom >
                Home
            </Typography>

            <h1>使用方法</h1>
            <Typography variant="body1" align="left" fontFamily={'Note Serif JP'} gutterBottom>
                このwebアプリはフロントエンドがReact+ViteでバックエンドはRustとSQLiteで作成されています.<br/>
                基本的な動きとしては,Room Makeのページに移動してRoomを作成し,Roomに入り戦うという予定です.
            </Typography>
        </div>
    );
};

export default home;
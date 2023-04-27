import React from 'react';
import Dialog from '@material-ui/core/Dialog';
// import DialogActions from '@material-ui/core/DialogActions';
// import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import ErrorIcon from '@material-ui/icons/ErrorRounded';
import Fade from "@material-ui/core/Fade";

const AlertDialog = (props) => {
  const { title, open, setOpen } = props;
  return (
    <Dialog
      style= {{width: "100%"}}
      open={open}
      onClose={() => setOpen(false)}
      TransitionComponent={Fade}
      TransitionProps={{ timeout: 0 }}
      aria-labelledby="confirm-dialog"
    >
       <DialogTitle id="confirm-dialog"> <ErrorIcon style = {{color: "red", fontSize: "55"}}></ErrorIcon>&nbsp; {title}</DialogTitle>
      {/* <DialogContent><Card content={content}></Card></DialogContent> */}
    </Dialog>
  );
};
export default AlertDialog;
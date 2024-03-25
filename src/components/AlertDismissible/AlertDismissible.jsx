import React from "react";
import {Alert} from "react-bootstrap";

class AlertDismissible extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      show: props.message ? true : false,
    };
  }

  handleDismiss = () => {
    this.setState({ show: false });
    this.props.onDismissClick && this.props.onDismissClick();
  };

  render() {
    if (this.state.show) {
      return (
        <Alert variant="danger" onClose={this.handleDismiss} dismissible>
          {this.props.message}
        </Alert>
      );
    }
    return "";
  }
}

export default AlertDismissible;
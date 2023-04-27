import React, { Component } from "react";
import Loader from "react-loader-spinner";
import { Dropdown } from "reactjs-dropdown-component";
import NoDataIcon from '@material-ui/icons/BlurOn';


export class Card extends Component {
  generateFailedStatus() {
    return (
      <div className="text-danger"  style={{ display: "flex", justifyContent: "center", marginBottom: 15, fontSize:'20px'}}>
        No data
      </div>
    );
  }

  generateNoData() {
    return (
      <div style={{ display: "flex", justifyContent: "center"}}>
        <NoDataIcon style = {{ fontSize: "120px", color: "gray" }}></NoDataIcon>
        {/* <NoDataIcon style = {{ fontSize: "120px", color: "gray" }}></NoDataIcon> */}
      </div>
    );
  }

  generateSpinner(bars) {
    let type = bars ? "Audio" : "Oval";
    return (
      <div style={{ display: "flex", justifyContent: "center"}}>
        <Loader
          type={type}
          color="#00BFFF"
          height="120"
          width="120"
          loading="false"
        />
      </div>
    );
  }


  generateInnerContent(bars) {
    let content = this.props.content;
    let status = this.props.status;

    if (status === false) {
      return this.generateFailedStatus();
    }
    if (content === undefined || content === "") {
      return this.generateNoData()
    }
    if (content === null || content === true || content === "loading") {
      return this.generateSpinner(bars);
    }
    return content;
  }

  generateIcon() {
    if (!this.props.statsIcon) {
      return "";
    }
    let color = this.props.statsIconColor || "blue";
    return (
      <div style={{ flex: "0 0 50px" }}>
        <i
          className={this.props.statsIcon}
          style={{ fontSize: 40, color: color }}
        />
      </div>
    );
  }

  generateDropDownList() {
    if (
      !this.props.dropdownlistData ||
      // !this.props.dropdownlistHandler ||
      !this.props.dropdownlistTitle
    ) {
      return "";
    }

    return (
      <div
        style={{
          position: "absolute",
          top: "0px",
          right: "0px",
          margin: "10px"
        }}
      >
        <Dropdown
          title={this.props.dropdownlistTitle}
          list={this.props.dropdownlistData}
          resetThenSet={this.props.dropdownlistHandler}
        />
      </div>
    );
  }

  render() {
    const cardHeight = this.props.cardHeight ? this.props.cardHeight : "85%";
    const contentStyle = this.props.css || {height: "100%", display: "flex", justifyContent: "center", alignItems: "center"};
    return (
      <React.Fragment>
        <div
          className={"card" + (this.props.plain ? " card-plain" : "")}
          style={{ boxShadow: this.props.plain ? "0px 0px 0px rgba(0, 0, 0, 0.0)" : "0px 2px 4px rgba(0, 0, 0, 0.15)", height: this.props.fluid ? cardHeight : "auto", width: "100%" }}
        >
          <div
            className={"header" + (this.props.hCenter ? " text-center" : "")}
            style={{ display: "flex" }}
          >
            {this.generateIcon()}
            <div style={{ flex: 1 }}>
              <h4 className="title"><b>{this.props.title}</b></h4>
              <p className="category">{this.props.description}</p>
            </div>
          </div>
          {this.generateDropDownList()}
          <div className="content" style={contentStyle}>
            {this.generateInnerContent(this.props.bars)}
            <div className="footer">
              {this.props.stats != null ? <hr /> : ""}
              {/* <div className="stats">
                <i className={this.props.statsIcon} /> {this.props.stats}
              </div> */}
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  }
}

export default Card;

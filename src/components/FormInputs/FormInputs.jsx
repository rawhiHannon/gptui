import React, { Component } from "react";
import { FormGroup, FormLabel, FormControl, Row } from "react-bootstrap";

function FieldGroup({ label, controlId, ...props }) {

  let input = (
    <FormControl style={{ borderColor: (props.color ? props.color : "#000"), fontSize: "14px" }}  {...props} />
  )

  if(props.as === "select") {
    input = (
      <FormControl style={{ borderColor: (props.color ? props.color : "#000"), fontSize: "14px" }}  {...props}>
      {
        props.options.map((_option, index) => {
          return (<option key={index} value={_option}>{_option}</option>)
        })
      }
      </FormControl>
    )
  }

  return (
    <FormGroup controlId={controlId}>
      <FormLabel style={{color: (props.color ? props.color : "#000"), fontFamily: "'Trebuchet MS', sans-serif", fontWeight: "bold", fontSize: "16px"}}>{label}</FormLabel>
      {input}
    </FormGroup>
  );
}

export class FormInputs extends Component {
  render() {
    var row = [];
    for (var i = 0; i < this.props.ncols.length; i++) {
      row.push(
        <div key={i} className={this.props.ncols[i]}>
          <FieldGroup {...this.props.proprieties[i]} />
        </div>
      );
    }
    return <Row>{row}</Row>;
  }
}

export default FormInputs;

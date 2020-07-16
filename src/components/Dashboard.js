//Importing all of the necessary components:
import React, { Component } from "react";
import classnames from "classnames";
import Loading from "components/Loading";
import Panel from "components/Panel";
import axios from "axios";
import {
  getTotalInterviews,
  getLeastPopularTimeSlot,
  getMostPopularDay,
  getInterviewsPerDay
} from "helpers/selectors";
import { setInterview } from "helpers/reducers";


//data to work with, in absence of actual API input
const data = [
  {
    id: 1,
    label: "Total Interviews",
    getValue: getTotalInterviews
  },
  {
    id: 2,
    label: "Least Popular Time Slot",
    getValue: getLeastPopularTimeSlot
  },
  {
    id: 3,
    label: "Most Popular Day",
    getValue: getMostPopularDay
  },
  {
    id: 4,
    label: "Interviews Per Day",
    getValue: getInterviewsPerDay
  }
];

//What the dashboard actually displays:
class Dashboard extends Component {
  //object-oriented coding requires the "extend component" above, 
  //and the state declaration below if we are to maintain/change state
  state = {
    loading: true,
    focused: null,
    days: [],
    appointments: {},
    interviewers: {}
  };
  //tracking state using the lifecycle method:
  componentDidMount() {
    const focused = JSON.parse(localStorage.getItem("focused"));
    Promise.all([
      //My api server is on a proxy. If this starts to fail, look
      //in DOM tools, network, /days, headers, to see if it's double-calling
      //the localhost part.
      axios.get("http://localhost:3001/api/days"),
      axios.get("http://localhost:3001/api/appointments"),
      axios.get("http://localhost:3001/api/interviewers")
    ]).then(([days, appointments, interviewers]) => {
      this.setState({
        loading: false,
        days: days.data,
        appointments: appointments.data,
        interviewers: interviewers.data
      });
    });
    this.socket = new WebSocket(process.env.REACT_APP_WEBSOCKET_URL);
      this.socket.onmessage = event => {
      const data = JSON.parse(event.data);
      if (typeof data === "object" && data.type === "SET_INTERVIEW") {
        this.setState(previousState =>
          setInterview(previousState, data.id, data.interview)
        );
      }
    };
    
    if (focused) {
      this.setState({ focused });
    }
  }
  //more lifecycle states
  componentDidUpdate(previousProps, previousState) {
    if (previousState.focused !== this.state.focused) {
      localStorage.setItem("focused", JSON.stringify(this.state.focused));
    }
  }

  


  //setstate function to change the focus to the id of a clicked panel
  //AND allow it to unfocus by returning to its previous state on second click
  selectPanel(id) {
    this.setState(previousState => ({
      focused: previousState.focused !== null ? null : id
    }));
  }

  //cleaning up after the component will mount above, because websockets
  //don't close unless you tell them to.
  componentWillUnmount() {
    this.socket.close();
  }


  //these objects must render something--it's like their return statement
  //and inside, there is a return, with other code defining the html
  render() {
    const dashboardClasses = classnames("dashboard", {
      //conditional state declaration below, ^^standard one above
      "dashboard--focused": this.state.focused
    }) 
    //conditional rendering of the loading function
    if (this.state.loading) {
      return <Loading />;
    }

    //the panels are the point of this page, so the code below
    //defines their functionality.
    const panels = data
    //the list of .functions is in order--check the focus state first
    //if we're focused, .filter to only show that panel.
    //if not, show all four using a .map.
    .filter(
      panel => this.state.focused === null || this.state.focused === panel.id
    )
    
    .map(panel => (
      <Panel
        key={panel.id}
        label={panel.label}
        value={panel.getValue(this.state)}
        onSelect={() => this.selectPanel(panel.id)}
      />
    ));
      //this return is what actually renders all of these things to
      //the DOM.
    return <main className={dashboardClasses}>{panels}</main>;
  }
}
  
//we're exporting this for later use, probably as an add-on to the 
//scheduler app we already made:
export default Dashboard;

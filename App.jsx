
import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  useGLTF,
  ContactShadows,
  Environment,
} from "@react-three/drei";
import * as THREE from "three";

import "./App.css";


/* =========================================================
   ENGINEERING COMPONENT DATABASE
========================================================= */

const COMPONENT_DATABASE = {
  Aircraft: {
    title: "A400M AIRCRAFT",
    code: "A/C-400M",
    status: "SERVICEABLE",
    description:
      "Primary aircraft configuration reference used for MRO engineering assessment and maintenance planning.",
    engineering:
      "Aircraft configuration must be positively identified before applying maintenance data, inspection procedures or work instructions.",
  },

  Fuselage: {
    title: "FUSELAGE STRUCTURE",
    code: "ATA 53",
    status: "INSPECTION AREA",
    description:
      "Primary fuselage load-bearing structure including skins, frames, stringers and associated structural joints.",
    engineering:
      "Inspect for dents, deformation, cracks, corrosion, fastener damage and indications affecting structural load paths.",
  },

  Wing: {
    title: "WING STRUCTURE",
    code: "ATA 57",
    status: "INSPECTION AREA",
    description:
      "Primary wing structural assembly responsible for aerodynamic loading and transmission of flight loads.",
    engineering:
      "Structural assessment should consider damage location, dimensions, orientation, surrounding fasteners and potential propagation.",
  },

  Engine: {
    title: "TP400 ENGINE AREA",
    code: "ATA 71",
    status: "CRITICAL SYSTEM",
    description:
      "Propulsion system inspection area associated with the TP400 turboprop engine installation.",
    engineering:
      "Engine-area inspection requires controlled maintenance procedures, configuration identification and applicable powerplant documentation.",
  },

  "Landing Gear": {
    title: "LANDING GEAR STRUCTURE",
    code: "ATA 32",
    status: "CRITICAL SYSTEM",
    description:
      "Landing gear structural and mechanical area supporting aircraft ground loads and landing operations.",
    engineering:
      "Inspection should address structural condition, attachment points, hydraulic interfaces, wear and evidence of abnormal loading.",
  },

  "Cargo Door": {
    title: "CARGO DOOR STRUCTURE",
    code: "ATA 52",
    status: "INSPECTION AREA",
    description:
      "Cargo access structure and associated door mechanism used during loading and unloading operations.",
    engineering:
      "Verify structural condition, locking interfaces, hinges, seals and evidence of deformation or impact damage.",
  },
};


/* =========================================================
   COMPONENT DETECTION
========================================================= */

function detectComponent(name = "") {
  const value = name.toLowerCase();

  if (
    value.includes("engine") ||
    value.includes("turbine") ||
    value.includes("propeller") ||
    value.includes("prop")
  ) {
    return "Engine";
  }

  if (
    value.includes("wing") ||
    value.includes("aileron") ||
    value.includes("flap") ||
    value.includes("spoiler")
  ) {
    return "Wing";
  }

  if (
    value.includes("gear") ||
    value.includes("wheel") ||
    value.includes("strut")
  ) {
    return "Landing Gear";
  }

  if (
    value.includes("door") ||
    value.includes("cargo") ||
    value.includes("ramp") ||
    value.includes("hatch")
  ) {
    return "Cargo Door";
  }

  if (
    value.includes("fuselage") ||
    value.includes("frame") ||
    value.includes("body") ||
    value.includes("skin") ||
    value.includes("nose") ||
    value.includes("tail")
  ) {
    return "Fuselage";
  }

  return "Aircraft";
}


/* =========================================================
   AIRCRAFT 3D MODEL
========================================================= */

function Aircraft({
  selectedComponent,
  setSelectedComponent,
  setHoveredComponent,
}) {
  const { scene } = useGLTF("/models/C-400.glb");

  const model = useMemo(() => {
    const cloned = scene.clone(true);

    cloned.traverse((child) => {
      if (!child.isMesh) return;

      child.castShadow = true;
      child.receiveShadow = true;

      /*
       * Clone the material so that highlighting one part
       * does not modify the original GLB material.
       */
      child.material = child.material.clone();

      child.userData.originalMaterial =
        child.material.clone();

      child.userData.engineeringComponent =
        detectComponent(child.name);
    });

    return cloned;
  }, [scene]);


  /* =======================================================
     APPLY ENGINEERING HIGHLIGHT
  ======================================================= */

  const applyHighlight = (object, color, intensity) => {
    if (!object || !object.material) return;

    object.material.emissive =
      new THREE.Color(color);

    object.material.emissiveIntensity =
      intensity;
  };


  /* =======================================================
     POINTER OVER
  ======================================================= */

  const handlePointerOver = (event) => {
    event.stopPropagation();

    const object = event.object;

    if (!object.isMesh) return;

    const component =
      object.userData.engineeringComponent ||
      "Aircraft";

    setHoveredComponent(component);

    document.body.style.cursor = "pointer";

    /*
     * Do not override the selected component.
     * Hover receives a subtle highlight.
     */
    if (component !== selectedComponent) {
      applyHighlight(
        object,
        "#2389d1",
        0.22
      );
    }
  };


  /* =======================================================
     POINTER OUT
  ======================================================= */

  const handlePointerOut = (event) => {
    event.stopPropagation();

    const object = event.object;

    if (!object.isMesh) return;

    const component =
      object.userData.engineeringComponent ||
      "Aircraft";

    /*
     * Remove hover highlight unless this
     * is the currently selected component.
     */
    if (component !== selectedComponent) {
      object.material =
        object.userData.originalMaterial.clone();
    }

    setHoveredComponent(null);

    document.body.style.cursor = "default";
  };


  /* =======================================================
     CLICK
  ======================================================= */

  const handleClick = (event) => {
    event.stopPropagation();

    const object = event.object;

    if (!object.isMesh) return;

    const component =
      object.userData.engineeringComponent ||
      "Aircraft";

    setSelectedComponent(component);
  };


  /* =======================================================
     UPDATE SELECTED COMPONENT
  ======================================================= */

  useMemo(() => {
    model.traverse((child) => {
      if (!child.isMesh) return;

      const component =
        child.userData.engineeringComponent ||
        "Aircraft";

      /*
       * Reset material first.
       */
      child.material =
        child.userData.originalMaterial.clone();

      /*
       * Highlight all meshes belonging
       * to the selected engineering area.
       */
      if (component === selectedComponent) {
        applyHighlight(
          child,
          "#1685d1",
          0.42
        );
      }
    });
  }, [model, selectedComponent]);


  return (
    <primitive
      object={model}
      scale={0.7}
      position={[0, 0, 0]}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    />
  );
}


/* =========================================================
   CAMERA / 3D VIEWER
========================================================= */

function AircraftViewer({
  selectedComponent,
  setSelectedComponent,
  setHoveredComponent,
}) {
  const controlsRef = useRef();

  return (
    <Canvas
      shadows
      camera={{
        position: [18, 10, 18],
        fov: 45,
        near: 0.1,
        far: 1000,
      }}
      dpr={[1, 2]}
      style={{
        width: "100%",
        height: "100%",
      }}
    >

      {/* =================================================
          BACKGROUND
      ================================================= */}

      <color
        attach="background"
        args={["#07111f"]}
      />


      {/* =================================================
          LIGHTING
      ================================================= */}

      <ambientLight
        intensity={1.7}
      />

      <directionalLight
        position={[10, 20, 10]}
        intensity={3}
        castShadow
      />

      <directionalLight
        position={[-15, 10, -10]}
        intensity={1.3}
      />

      <directionalLight
        position={[0, 5, 20]}
        intensity={1.4}
      />


      {/* =================================================
          ENVIRONMENT
      ================================================= */}

      <Environment preset="city" />


      {/* =================================================
          AIRCRAFT SHADOW
      ================================================= */}

      <ContactShadows
        position={[0, -2, 0]}
        opacity={0.42}
        scale={30}
        blur={2}
        far={10}
      />


      {/* =================================================
          AIRCRAFT
      ================================================= */}

      <Aircraft
        selectedComponent={selectedComponent}
        setSelectedComponent={setSelectedComponent}
        setHoveredComponent={setHoveredComponent}
      />


      {/* =================================================
          ENGINEERING FLOOR GRID
      ================================================= */}

      <gridHelper
        args={[30, 30]}
        position={[0, -2, 0]}
        rotation={[0, 0, 0]}
      />


      {/* =================================================
          CAMERA CONTROL
      ================================================= */}

      <OrbitControls
        ref={controlsRef}

        enableDamping
        dampingFactor={0.05}

        minDistance={5}
        maxDistance={45}

        minPolarAngle={0.25}
        maxPolarAngle={Math.PI - 0.25}

        target={[0, 0, 0]}
      />

    </Canvas>
  );
}


/* =========================================================
   MAIN APPLICATION
========================================================= */

function App() {

  /* =======================================================
     ENGINEERING STATE
  ======================================================= */

  const [laborHours, setLaborHours] =
    useState(12.5);

  const [laborRate, setLaborRate] =
    useState(60);

  const [materialCost, setMaterialCost] =
    useState(840);

  const [task, setTask] =
    useState("Structural Inspection");

  const [component, setComponent] =
    useState("Fuselage Structural Panel");

  const [inspectionMethod, setInspectionMethod] =
    useState("Visual Inspection");

  const [damageType, setDamageType] =
    useState("Dent / Local Deformation");

  const [disposition] =
    useState(
      "Engineering Assessment Required"
    );

  const [workOrderGenerated, setWorkOrderGenerated] =
    useState(false);

  const [inspectionComplete, setInspectionComplete] =
    useState(false);


  /* =======================================================
     3D STATE
  ======================================================= */

  const [selectedComponent, setSelectedComponent] =
    useState("Aircraft");

  const [hoveredComponent, setHoveredComponent] =
    useState(null);


  /* =======================================================
     COST CALCULATION
  ======================================================= */

  const laborCost =
    Number(laborHours || 0) *
    Number(laborRate || 0);

  const totalCost =
    laborCost +
    Number(materialCost || 0);


  /* =======================================================
     SELECTED COMPONENT DATA
  ======================================================= */

  const selectedData =
    COMPONENT_DATABASE[selectedComponent] ||
    COMPONENT_DATABASE.Aircraft;


  /* =======================================================
     COMPONENT BUTTON
  ======================================================= */

  const select3DComponent = (name) => {
    setSelectedComponent(name);
  };


  return (
    <div className="app">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="header">

        <div className="headerLeft">

          <div className="brand">
            AIRBUS
          </div>

          <div className="headerTitle">

            <h1>
              A400M MRO ENGINEERING
            </h1>

            <p>
              Maintenance • Repair • Overhaul Engineering Workstation
            </p>

          </div>

        </div>


        <div className="systemStatus">

          <span className="statusDot"></span>

          SYSTEM READY

        </div>

      </header>


      {/* =================================================
          MAIN DASHBOARD
      ================================================= */}

      <main className="dashboard">


        {/* =================================================
            LEFT — AIRCRAFT
        ================================================= */}

        <section className="aircraftPanel">


          {/* =================================================
              PANEL HEADER
          ================================================= */}

          <div className="panelHeader">

            <div>

              <h2>
                Aircraft Engineering Visualization
              </h2>

              <p>
                Interactive 3D aircraft configuration and inspection reference
              </p>

            </div>

            <div className="aircraftBadge">
              A400M
            </div>

          </div>


          {/* =================================================
              3D VIEWER
          ================================================= */}

          <div className="viewer">

            <AircraftViewer
              selectedComponent={selectedComponent}
              setSelectedComponent={setSelectedComponent}
              setHoveredComponent={setHoveredComponent}
            />


            {/* =================================================
                HOVER INFORMATION
            ================================================= */}

            {hoveredComponent && (

              <div className="viewerHoverInfo">

                <span>
                  COMPONENT IDENTIFIED
                </span>

                <strong>
                  {hoveredComponent}
                </strong>

                <small>
                  Click for engineering assessment
                </small>

              </div>

            )}


            {/* =================================================
                SELECTED COMPONENT
            ================================================= */}

            <div className="viewerSelection">

              <span>
                SELECTED ENGINEERING AREA
              </span>

              <strong>
                {selectedData.title}
              </strong>

              <small>
                {selectedData.code}
              </small>

            </div>

          </div>


          {/* =================================================
              VIEWER FOOTER
          ================================================= */}

          <div className="viewerFooter">

            <span>
              🖱 Drag — Rotate
            </span>

            <span>
              🔍 Scroll — Zoom
            </span>

            <span>
              🖱 Click — Inspect
            </span>

            <span>
              3D ENGINEERING MODEL
            </span>

          </div>


          {/* =================================================
              COMPONENT SELECTOR
          ================================================= */}

          <div className="componentSelector">

            <div className="componentSelectorHeader">

              <div>

                <span>
                  ENGINEERING COMPONENT SELECTION
                </span>

                <strong>
                  Select an aircraft area for assessment
                </strong>

              </div>

            </div>


            <div className="componentButtons">

              {Object.keys(COMPONENT_DATABASE).map(
                (name) => (

                  <button
                    key={name}

                    className={
                      selectedComponent === name
                        ? "componentButton active"
                        : "componentButton"
                    }

                    onClick={() =>
                      select3DComponent(name)
                    }
                  >
                    {name}
                  </button>

                )
              )}

            </div>

          </div>


          {/* =================================================
              ENGINEERING TARGET
          ================================================= */}

          <div className="selectedEngineering">

            <div className="selectedEngineeringHeader">

              <div>

                <span>
                  ENGINEERING INSPECTION TARGET
                </span>

                <h3>
                  {selectedData.title}
                </h3>

              </div>

              <span className="componentCode">
                {selectedData.code}
              </span>

            </div>


            <div className="engineeringStatus">

              <span>
                STATUS
              </span>

              <strong>
                {selectedData.status}
              </strong>

            </div>


            <p>
              {selectedData.description}
            </p>


            <div className="engineeringNote">

              <strong>
                SENIOR ENGINEERING NOTE
              </strong>

              <p>
                {selectedData.engineering}
              </p>

            </div>

          </div>


          {/* =================================================
              AIRCRAFT INFORMATION
          ================================================= */}

          <div className="aircraftInfo">

            <div className="infoBlock">

              <span className="infoLabel">
                AIRCRAFT
              </span>

              <strong>
                A400M
              </strong>

            </div>


            <div className="infoBlock">

              <span className="infoLabel">
                ENGINEERING AREA
              </span>

              <strong>
                MRO / STRUCTURES
              </strong>

            </div>


            <div className="infoBlock">

              <span className="infoLabel">
                ATA CHAPTER
              </span>

              <strong>
                {selectedData.code}
              </strong>

            </div>


            <div className="infoBlock">

              <span className="infoLabel">
                STATUS
              </span>

              <strong className="green">
                SERVICEABLE
              </strong>

            </div>

          </div>

        </section>


        {/* =================================================
            RIGHT — ENGINEERING WORKSTATION
        ================================================= */}

        <section className="engineeringPanel">


          {/* =================================================
              ACTIVE ASSESSMENT
          ================================================= */}

          <div className="card selectedSummary">

            <div className="cardTitle">

              <h2>
                ACTIVE ENGINEERING ASSESSMENT
              </h2>

              <span className="activeTag">
                LIVE
              </span>

            </div>


            <div className="selectedSummaryGrid">

              <div>

                <label>
                  SELECTED AREA
                </label>

                <strong>
                  {selectedData.title}
                </strong>

              </div>


              <div>

                <label>
                  ATA REFERENCE
                </label>

                <strong>
                  {selectedData.code}
                </strong>

              </div>


              <div>

                <label>
                  SYSTEM STATUS
                </label>

                <strong className="green">
                  {selectedData.status}
                </strong>

              </div>


              <div>

                <label>
                  INSPECTION MODE
                </label>

                <strong>
                  ENGINEERING REVIEW
                </strong>

              </div>

            </div>

          </div>


          {/* =================================================
              MRO TASK
          ================================================= */}

          <div className="card">

            <div className="cardTitle">

              <h2>
                MRO TASK DEFINITION
              </h2>

              <span className="activeTag">
                ACTIVE
              </span>

            </div>


            <div className="taskGrid">

              <div className="dataItem">

                <label>
                  Aircraft
                </label>

                <strong>
                  A400M
                </strong>

              </div>


              <div className="dataItem">

                <label>
                  Work Order
                </label>

                <strong>
                  MRO-2027-001
                </strong>

              </div>


              <div className="dataItem">

                <label>
                  ATA Chapter
                </label>

                <strong>
                  {selectedData.code}
                </strong>

              </div>


              <div className="dataItem">

                <label>
                  Maintenance Base
                </label>

                <strong>
                  MRO Hangar
                </strong>

              </div>

            </div>


            <label>
              Maintenance Task
            </label>

            <select
              value={task}
              onChange={(e) =>
                setTask(e.target.value)
              }
            >

              <option>
                Structural Inspection
              </option>

              <option>
                Component Inspection
              </option>

              <option>
                Damage Assessment
              </option>

              <option>
                Repair Preparation
              </option>

              <option>
                Final Inspection
              </option>

            </select>


            <div className="technicalDescription">

              <strong>
                Engineering Objective
              </strong>

              <p>
                Assess the selected aircraft structure,
                establish applicable inspection requirements,
                evaluate observed damage against approved
                maintenance limits and prepare technical
                information required for controlled shop-floor
                execution.
              </p>

            </div>

          </div>


          {/* =================================================
              COMPONENT ASSESSMENT
          ================================================= */}

          <div className="card">

            <div className="cardTitle">

              <h2>
                COMPONENT ASSESSMENT
              </h2>

            </div>


            <label>
              Inspected Component
            </label>

            <select
              value={component}
              onChange={(e) =>
                setComponent(e.target.value)
              }
            >

              <option>
                Fuselage Structural Panel
              </option>

              <option>
                Wing Structural Element
              </option>

              <option>
                Landing Gear Structure
              </option>

              <option>
                Engine Mount Area
              </option>

              <option>
                Cargo Door Structure
              </option>

            </select>


            <label>
              Inspection Method
            </label>

            <select
              value={inspectionMethod}
              onChange={(e) =>
                setInspectionMethod(e.target.value)
              }
            >

              <option>
                Visual Inspection
              </option>

              <option>
                Dimensional Inspection
              </option>

              <option>
                NDT — Ultrasonic
              </option>

              <option>
                NDT — Eddy Current
              </option>

              <option>
                NDT — Dye Penetrant
              </option>

            </select>


            <label>
              Observed Damage
            </label>

            <select
              value={damageType}
              onChange={(e) =>
                setDamageType(e.target.value)
              }
            >

              <option>
                Dent / Local Deformation
              </option>

              <option>
                Scratch / Surface Damage
              </option>

              <option>
                Crack Indication
              </option>

              <option>
                Corrosion
              </option>

              <option>
                Fastener Damage
              </option>

              <option>
                No Damage Detected
              </option>

            </select>


            <div className="engineeringDecision">

              <span>
                ENGINEERING DISPOSITION
              </span>

              <strong>
                {disposition}
              </strong>

            </div>

          </div>


          {/* =================================================
              ENGINEERING ANALYSIS
          ================================================= */}

          <div className="card">

            <div className="cardTitle">

              <h2>
                ENGINEERING ANALYSIS
              </h2>

            </div>


            <div className="analysisGrid">

              <div className="analysisItem">

                <span>
                  01
                </span>

                <div>

                  <strong>
                    Damage Characterisation
                  </strong>

                  <p>
                    Identify damage type, location,
                    dimensions, orientation and affected
                    structural area.
                  </p>

                </div>

              </div>


              <div className="analysisItem">

                <span>
                  02
                </span>

                <div>

                  <strong>
                    Limit Assessment
                  </strong>

                  <p>
                    Compare measured damage against
                    applicable approved maintenance
                    limits and engineering data.
                  </p>

                </div>

              </div>


              <div className="analysisItem">

                <span>
                  03
                </span>

                <div>

                  <strong>
                    Structural Evaluation
                  </strong>

                  <p>
                    Consider load path, structural
                    function, surrounding fasteners,
                    material condition and damage propagation.
                  </p>

                </div>

              </div>


              <div className="analysisItem">

                <span>
                  04
                </span>

                <div>

                  <strong>
                    Engineering Disposition
                  </strong>

                  <p>
                    Determine whether the component can
                    remain in service, requires monitoring,
                    repair or further engineering assessment.
                  </p>

                </div>

              </div>

            </div>

          </div>


          {/* =================================================
              ENGINEERING REQUIREMENTS
          ================================================= */}

          <div className="card">

            <div className="cardTitle">

              <h2>
                ENGINEERING CONTROL REQUIREMENTS
              </h2>

            </div>


            <div className="requirementRow">

              <span>
                Aircraft Configuration Identification
              </span>

              <strong className="green">
                VERIFIED
              </strong>

            </div>


            <div className="requirementRow">

              <span>
                Applicable Technical Data
              </span>

              <strong className="green">
                REQUIRED
              </strong>

            </div>


            <div className="requirementRow">

              <span>
                Component Traceability
              </span>

              <strong className="green">
                REQUIRED
              </strong>

            </div>


            <div className="requirementRow">

              <span>
                Tool Calibration
              </span>

              <strong className="green">
                VERIFIED
              </strong>

            </div>


            <div className="requirementRow">

              <span>
                Personnel Qualification
              </span>

              <strong className="green">
                VERIFIED
              </strong>

            </div>


            <div className="requirementRow">

              <span>
                Independent Inspection
              </span>

              <strong className="green">
                REQUIRED
              </strong>

            </div>

          </div>


          {/* =================================================
              COST
          ================================================= */}

          <div className="card">

            <div className="cardTitle">

              <h2>
                MRO COST & LABOR CALCULATION
              </h2>

            </div>


            <div className="inputGrid">

              <div>

                <label>
                  Labor Hours
                </label>

                <input
                  type="number"
                  step="0.1"
                  value={laborHours}
                  onChange={(e) =>
                    setLaborHours(e.target.value)
                  }
                />

              </div>


              <div>

                <label>
                  Labor Rate (€ / hour)
                </label>

                <input
                  type="number"
                  value={laborRate}
                  onChange={(e) =>
                    setLaborRate(e.target.value)
                  }
                />

              </div>

            </div>


            <label>
              Material Cost (€)
            </label>

            <input
              type="number"
              value={materialCost}
              onChange={(e) =>
                setMaterialCost(e.target.value)
              }
            />


            <div className="calculationBox">

              <div className="calculationRow">

                <span>
                  Labor Cost
                </span>

                <strong>
                  €{laborCost.toFixed(2)}
                </strong>

              </div>


              <div className="calculationRow">

                <span>
                  Material Cost
                </span>

                <strong>
                  €{Number(materialCost || 0).toFixed(2)}
                </strong>

              </div>


              <div className="calculationRow">

                <span>
                  Engineering / Planning
                </span>

                <strong>
                  €250.00
                </strong>

              </div>


              <div className="totalRow">

                <span>
                  ESTIMATED MRO COST
                </span>

                <strong>
                  €{(totalCost + 250).toFixed(2)}
                </strong>

              </div>

            </div>

          </div>


          {/* =================================================
              INSPECTION RECORD
          ================================================= */}

          <div className="card">

            <div className="cardTitle">

              <h2>
                INSPECTION RECORD
              </h2>

            </div>


            <div className="recordGrid">

              <div>

                <label>
                  Component
                </label>

                <strong>
                  {component}
                </strong>

              </div>


              <div>

                <label>
                  Inspection
                </label>

                <strong>
                  {inspectionMethod}
                </strong>

              </div>


              <div>

                <label>
                  Damage
                </label>

                <strong>
                  {damageType}
                </strong>

              </div>


              <div>

                <label>
                  Inspector Status
                </label>

                <strong>
                  {inspectionComplete
                    ? "INSPECTION COMPLETE"
                    : "PENDING INSPECTION"}
                </strong>

              </div>

            </div>


            <button
              className={
                inspectionComplete
                  ? "secondaryButton"
                  : "primaryButton"
              }

              onClick={() =>
                setInspectionComplete(
                  !inspectionComplete
                )
              }
            >

              {inspectionComplete
                ? "RESET INSPECTION"
                : "COMPLETE INSPECTION"}

            </button>

          </div>


          {/* =================================================
              WORK ORDER
          ================================================= */}

          <div className="card">

            <div className="cardTitle">

              <h2>
                WORK ORDER GENERATION
              </h2>

            </div>


            {!workOrderGenerated ? (

              <button
                className="primaryButton"

                onClick={() =>
                  setWorkOrderGenerated(true)
                }
              >
                GENERATE WORK ORDER
              </button>

            ) : (

              <div className="workOrder">

                <div className="workOrderHeader">

                  <strong>
                    MRO-2027-001
                  </strong>

                  <span>
                    READY FOR SHOP-FLOOR
                  </span>

                </div>


                <div className="workOrderRow">

                  <span>
                    Aircraft
                  </span>

                  <strong>
                    A400M
                  </strong>

                </div>


                <div className="workOrderRow">

                  <span>
                    Task
                  </span>

                  <strong>
                    {task}
                  </strong>

                </div>


                <div className="workOrderRow">

                  <span>
                    Engineering Area
                  </span>

                  <strong>
                    {selectedData.title}
                  </strong>

                </div>


                <div className="workOrderRow">

                  <span>
                    Component
                  </span>

                  <strong>
                    {component}
                  </strong>

                </div>


                <div className="workOrderRow">

                  <span>
                    Inspection Method
                  </span>

                  <strong>
                    {inspectionMethod}
                  </strong>

                </div>


                <div className="workOrderRow">

                  <span>
                    Damage
                  </span>

                  <strong>
                    {damageType}
                  </strong>

                </div>


                <div className="workOrderRow">

                  <span>
                    Estimated Cost
                  </span>

                  <strong>
                    €{(totalCost + 250).toFixed(2)}
                  </strong>

                </div>


                <button
                  className="secondaryButton"

                  onClick={() =>
                    setWorkOrderGenerated(false)
                  }
                >
                  EDIT WORK ORDER
                </button>

              </div>

            )}

          </div>


          {/* =================================================
              SENIOR ENGINEERING NOTES
          ================================================= */}

          <div className="card">

            <div className="cardTitle">

              <h2>
                SENIOR ENGINEERING NOTES
              </h2>

            </div>


            <div className="notes">

              <p>

                <strong>
                  Configuration control:
                </strong>{" "}

                Aircraft and component identification shall
                be confirmed before applying maintenance
                instructions or engineering limits.

              </p>


              <p>

                <strong>
                  Damage assessment:
                </strong>{" "}

                Visual identification alone should not be
                considered sufficient for final engineering
                disposition where dimensional or NDT
                inspection is required.

              </p>


              <p>

                <strong>
                  Structural integrity:
                </strong>{" "}

                Damage assessment should consider load path,
                structural function, surrounding fasteners,
                material condition and potential propagation.

              </p>


              <p>

                <strong>
                  Maintenance execution:
                </strong>{" "}

                Engineering assessment provides the technical
                basis for controlled shop-floor execution.
                Approved maintenance data remains the governing
                source for actual aircraft maintenance.

              </p>


              <p>

                <strong>
                  Quality assurance:
                </strong>{" "}

                Independent inspection, technical records,
                material traceability and configuration control
                provide essential quality gates prior to
                return-to-service decisions.

              </p>

            </div>

          </div>


        </section>

      </main>


      {/* =================================================
          FOOTER
      ================================================= */}

      <footer className="footer">

        <span>
          DOCUMENTATION
        </span>

        <span>
          ENGINEERING ANALYSIS
        </span>

        <span>
          DAMAGE ASSESSMENT
        </span>

        <span>
          COST ESTIMATION
        </span>

        <span>
          WORK ORDER
        </span>

        <span>
          QUALITY CONTROL
        </span>

        <span>
          SHOP-FLOOR SUPPORT
        </span>

      </footer>

    </div>
  );
}


/* =========================================================
   GLB PRELOAD
========================================================= */

useGLTF.preload("/models/C-400.glb");


export default App;


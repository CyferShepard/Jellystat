import { useState } from "react";
// import TableHead from "@mui/material/TableHead";
// import TableRow from "@mui/material/TableRow";
// import { Trans } from "react-i18next";
// import i18next from "i18next";

import Loading from "../general/loading";
import { Form } from "react-bootstrap";

function LibraryFilterModal(props) {
  if (!props || !props.libraries) {
    return <Loading />;
  }

  const handleLibrarySelection = (event) => {
    const selectedOptions = props.selectedLibraries.find((library) => library === event.target.value)
      ? props.selectedLibraries.filter((library) => library !== event.target.value)
      : [...props.selectedLibraries, event.target.value];

    props.onSelectionChange(selectedOptions);
  };

  return (
    <div className="px-5 py-2">
      <Form>
        {props.libraries.map((library) => (
          <Form.Check
            key={library.Id}
            type="checkbox"
            id={library.Id}
            label={library.Name}
            value={library.Id}
            onChange={handleLibrarySelection}
            checked={props.selectedLibraries.includes(library.Id)}
          />
        ))}
      </Form>
    </div>
  );
}

export default LibraryFilterModal;

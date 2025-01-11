import "./css/stats.css";

import { Trans } from "react-i18next";
import ActivityTimelineComponent from "./components/activity-timeline/activity-timeline";
import { useEffect, useState } from "react";

import axios from "../lib/axios_instance.jsx";
import Config from "../lib/config.jsx";
import "./css/timeline/activity-timeline.css";
import Loading from "./components/general/loading";
import { Button, FormSelect, Modal } from "react-bootstrap";
import LibraryFilterModal from "./components/library/library-filter-modal";

function ActivityTimeline() {
  const [users, setUsers] = useState();
  const [selectedUser, setSelectedUser] = useState(
    localStorage.getItem("PREF_ACTIVITY_TIMELINE_selectedUser") ?? ""
  );
  const [libraries, setLibraries] = useState();
  const [config, setConfig] = useState(null);
  const [showLibraryFilters, setShowLibraryFilters] = useState(false);
  const [selectedLibraries, setSelectedLibraries] = useState(
    localStorage.getItem("PREF_ACTIVITY_TIMELINE_selectedLibraries") !=
      undefined
      ? JSON.parse(
          localStorage.getItem("PREF_ACTIVITY_TIMELINE_selectedLibraries")
        )
      : []
  );

  const handleLibraryFilter = (selectedOptions) => {
    setSelectedLibraries(selectedOptions);
    localStorage.setItem(
      "PREF_ACTIVITY_TIMELINE_selectedLibraries",
      JSON.stringify(selectedOptions)
    );
  };
  const handleUserSelection = (selectedUser) => {
    console.log(selectedUser);

    setSelectedUser(selectedUser);
    localStorage.setItem("PREF_ACTIVITY_TIMELINE_selectedUser", selectedUser);
  };

  const toggleSelectAll = () => {
    if (selectedLibraries.length > 0) {
      setSelectedLibraries([]);
      localStorage.setItem(
        "PREF_ACTIVITY_TIMELINE_selectedLibraries",
        JSON.stringify([])
      );
    } else {
      setSelectedLibraries(libraries.map((library) => library.Id));
      localStorage.setItem(
        "PREF_ACTIVITY_TIMELINE_selectedLibraries",
        JSON.stringify(libraries.map((library) => library.Id))
      );
    }
  };

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const newConfig = await Config.getConfig();
        setConfig(newConfig);
      } catch (error) {
        if (error.code === "ERR_NETWORK") {
          console.log(error);
        }
      }
    };

    if (!config) {
      fetchConfig();
    }
  }, [config]);

  useEffect(() => {
    if (config) {
      const url = `/stats/getAllUserActivity`;
      axios
        .get(url, {
          headers: {
            Authorization: `Bearer ${config.token}`,
            "Content-Type": "application/json",
          },
        })
        .then((users) => {
          setUsers(users.data);
        })
        .catch((error) => {
          console.log(error);
        });
    }
  }, [config]);

  useEffect(() => {
    if (config) {
      const url = `/stats/getLibraryMetadata`;
      axios
        .get(url, {
          headers: {
            Authorization: `Bearer ${config.token}`,
            "Content-Type": "application/json",
          },
        })
        .then((libraries) => {
          setLibraries(libraries.data);
        })
        .catch((error) => {
          console.log(error);
        });
    }
  }, [config]);

  return users?.length > 0 && libraries?.length > 0 ? (
    <div className="watch-stats">
      <div className="Heading">
        <h1>
          <Trans i18nKey={"TIMELINE_PAGE.TIMELINE"} />
        </h1>
        <div
          className="d-flex flex-column flex-md-row"
          style={{ whiteSpace: "nowrap" }}
        >
          <div className="user-selection">
            <div className="d-flex flex-row w-100 ms-md-3 w-sm-100 w-md-75 mb-3 my-md-3">
              <div className="d-flex flex-col rounded-0 rounded-start  align-items-center px-2 bg-primary-1">
                <Trans i18nKey="USER" />
              </div>
              <FormSelect
                onChange={(e) => handleUserSelection(e.target.value)}
                value={selectedUser}
                className="w-md-75 rounded-0 rounded-end"
              >
                {users.map((user) => (
                  <option key={user.UserId} value={user.UserId}>
                    {user.UserName}
                  </option>
                ))}
              </FormSelect>
            </div>
          </div>
          <div className="library-selection">
            <Button
              onClick={() => setShowLibraryFilters(true)}
              className="ms-md-3 mb-3 my-md-3"
            >
              <Trans i18nKey="MENU_TABS.LIBRARIES" />
            </Button>

            <Modal
              show={showLibraryFilters}
              onHide={() => setShowLibraryFilters(false)}
            >
              <Modal.Header>
                <Modal.Title>
                  <Trans i18nKey="MENU_TABS.LIBRARIES" />
                </Modal.Title>
              </Modal.Header>
              <LibraryFilterModal
                libraries={libraries}
                selectedLibraries={selectedLibraries}
                onSelectionChange={handleLibraryFilter}
              />
              <Modal.Footer>
                <Button variant="outline-primary" onClick={toggleSelectAll}>
                  <Trans i18nKey="ACTIVITY_TABLE.TOGGLE_SELECT_ALL" />
                </Button>
                <Button
                  variant="outline-primary"
                  onClick={() => setShowLibraryFilters(false)}
                >
                  <Trans i18nKey="CLOSE" />
                </Button>
              </Modal.Footer>
            </Modal>
          </div>
        </div>
      </div>
      <div>
        {selectedUser && selectedLibraries?.length > 0 && (
          <ActivityTimelineComponent
            userId={selectedUser}
            libraries={selectedLibraries}
          />
        )}
      </div>
    </div>
  ) : (
    <Loading />
  );
}

export default ActivityTimeline;

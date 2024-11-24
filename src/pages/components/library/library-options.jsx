import axios from "../../../lib/axios_instance";
import i18next from "i18next";
import { useState } from "react";
import { Container, Row, Col, Modal } from "react-bootstrap";
import { Trans } from "react-i18next";
import { useNavigate } from "react-router-dom";

function LibraryOptions(props) {
  const token = localStorage.getItem("token");
  const [show, setShow] = useState(false);
  const options = [
    {
      description: i18next.t("PURGE_OPTIONS.PURGE_LIBRARY_CACHE"),
      withActivity: false,
      isLibraryArchived: true,
      url: `/api/library/purge`,
    },
    {
      description: i18next.t("PURGE_OPTIONS.PURGE_LIBRARY_CACHE_WITH_ACTIVITY"),
      withActivity: true,
      isLibraryArchived: true,
      url: `/api/library/purge`,
    },
    {
      description: i18next.t("PURGE_OPTIONS.PURGE_LIBRARY_ITEMS_CACHE"),
      withActivity: false,
      isLibraryArchived: false,
      url: `/api/libraryItems/purge`,
    },
    {
      description: i18next.t("PURGE_OPTIONS.PURGE_LIBRARY_ITEMS_CACHE_WITH_ACTIVITY"),
      withActivity: true,
      isLibraryArchived: false,
      url: `/api/libraryItems/purge`,
    },
  ];
  const [selectedOption, setSelectedOption] = useState(options[0]);
  const navigate = useNavigate();

  async function execPurge(url, withActivity) {
    return await axios
      .delete(
        url,

        {
          data: {
            id: props.LibraryId,
            withActivity: withActivity,
          },
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )
      .then((response) => {
        console.log(response);
        setShow(false);
        navigate(-1);
      })
      .catch((error) => {
        console.log({ error: error, token: token });
      });
  }

  return (
    <div className="Activity">
      <div className="Heading mb-3">
        <h1>
          <Trans i18nKey="ITEM_INFO.ARCHIVED_DATA_OPTIONS" />
        </h1>
      </div>
      <Container className="p-0 m-0">
        {options
          .filter((option) => option.isLibraryArchived == props.isArchived)
          .map((option, index) => (
            <Row key={index} className="mb-2 me-0">
              <Col>
                <span>{option.description}</span>
              </Col>

              <Col>
                <button
                  className="btn btn-danger w-25"
                  onClick={() => {
                    setSelectedOption(option);
                    setShow(true);
                  }}
                >
                  <Trans i18nKey="ITEM_INFO.PURGE" />
                </button>
              </Col>
            </Row>
          ))}

        <Modal
          show={show}
          onHide={() => {
            setShow(false);
          }}
        >
          <Modal.Header closeButton>
            <Modal.Title>
              <Trans i18nKey="ITEM_INFO.CONFIRM_ACTION" />
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>
              {i18next.t("ITEM_INFO.CONFIRM_ACTION_MESSAGE") +
                (selectedOption.withActivity ? ` ${i18next.t("ITEM_INFO.CONFIRM_ACTION_MESSAGE_2")}?` : "?")}
            </p>
          </Modal.Body>
          <Modal.Footer>
            <button
              className="btn btn-danger"
              onClick={() => {
                execPurge(selectedOption.url, selectedOption.withActivity);
              }}
            >
              <Trans i18nKey="ITEM_INFO.PURGE" />
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                setShow(false);
              }}
            >
              <Trans i18nKey="CLOSE" />
            </button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
}

export default LibraryOptions;

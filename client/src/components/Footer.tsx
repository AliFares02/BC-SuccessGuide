import useAuthContext from "../hooks/useAuthContext";
function Footer() {
  const { user } = useAuthContext();

  const departmentContactMap = {
    Communication: [
      "slevy@brooklyn.cuny.edu",
      "718-951-5225",
      "3439 Boylan Hall",
    ],
    "Communication Sciences and Disorders": [
      "casd@brooklyn.cuny.edu",
      ,
      "718‑951‑5225",
      "3439 Boylan Hall",
    ],
    "Africana Studies": [
      "africanastudies@brooklyn.cuny.edu",
      "718-951-5597",
      "3105 James Hall",
    ],
  };
  return (
    <div className="footer-container">
      <div className="main-footer-content">
        <div>
          <h4>Resources</h4>
          <ul>
            <li>
              <a
                href="https://brooklyn-undergraduate-preview.catalog.cuny.edu/courses"
                target="_blank"
              >
                Course Catalog
              </a>
            </li>
            <li>
              <a href="https://www.brooklyn.edu/advisement/" target="_blank">
                Advising
              </a>
            </li>
            <li>
              <a href="https://home.cunyfirst.cuny.edu/" target="_blank">
                CUNYfirst
              </a>
            </li>
            <li>
              <a
                href="https://www.brooklyn.edu/registrar/academic-calendars/"
                target="_blank"
              >
                Academic Calendar
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4>Contact</h4>
          <ul>
            {departmentContactMap[
              user?.department as keyof typeof departmentContactMap
            ]?.map((contact, idx) => {
              if (!contact) return null;

              if (idx === 0) {
                return (
                  <li key={idx}>
                    <a href={`mailto:${contact}`}>{contact}</a>
                  </li>
                );
              }

              if (idx === 1) {
                const telNumber = "+1" + contact.replace(/\D/g, "");
                return (
                  <li key={idx}>
                    <a href={`tel:${telNumber}`}>{contact}</a>
                  </li>
                );
              }

              return <li key={idx}>{contact}</li>;
            })}
          </ul>
        </div>
      </div>
      <div className="footer-disclaimer">
        <strong>Please note:</strong> This site's data is not connected to
        CUNYfirst. To ensure accurate guidance, please enter only correct and
        honest information. This tool is designed to help students and
        department chairs manage and track degree and career progress
        effectively.
      </div>
      <div className="bc-trademark-container-footer">
        <span>2110 Boylan Hall, 2900 Bedford Avenue, Brooklyn, NY 11210</span>
        <span>© 2025 Brooklyn College</span>
      </div>
    </div>
  );
}

export default Footer;

import photos from "../data/productPhotos.json";
import { Reveal } from "../Motion";

export function PhotoCredits() {
  return (
    <Reveal className="section">
      <div className="page-heading">
        <span className="eyebrow red-text">PHOTOGRAPHY</span>
        <h1>Photo credits.</h1>
        <p>
          Credits for the illustrative product photography. These images show
          the types of items in the catalogue and are not photographs of
          verified Verimarts stock.
        </p>
        <p className="small muted">
          Images are downloaded at reduced resolution and cropped to fit cards.
          Each photograph retains its linked source license.
        </p>
      </div>
      <div className="vehicle-grid">
        {photos.map((photo) => (
          <article className="vehicle-card" key={photo.slug}>
            <div className="card-photo">
              <img src={photo.asset} alt={photo.title} loading="lazy" />
            </div>
            <div className="card-body">
              <h2>{photo.title}</h2>
              <p className="small">{photo.sourceTitle}</p>
              <p className="small muted">{photo.author}</p>
              <p className="small">
                <a
                  href={photo.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Source photograph
                </a>{" "}
                ·{" "}
                <a
                  href={photo.licenseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {photo.license}
                </a>
              </p>
            </div>
          </article>
        ))}
      </div>
    </Reveal>
  );
}

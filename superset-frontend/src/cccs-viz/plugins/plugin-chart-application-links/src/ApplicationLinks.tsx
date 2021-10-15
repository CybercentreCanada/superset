import { ApplicationsProps } from "./types";

export default function ApplicationLinks(props: ApplicationsProps) {
    const { ip_string } = props;

    const alfredUrl = "https://alfred-tst.u.chimera.azure.cyber.gc.ca/?expression=MATCH%20(ip%3AIP_ADDRESS)%20WHERE%20ip.value%20IN%20%5B%22" + ip_string + "%22%5D%20RETURN%20ip.value%2C%20ip.maliciousness%2C%20ip.creation_date%2C%20ip.created_by%2C%20ip.uri%2C%20ip.report_uri";

    return (
        <div>
            <p><a href={ alfredUrl } target="_blank">Visit Alfred</a></p>
        </div>
    );
}
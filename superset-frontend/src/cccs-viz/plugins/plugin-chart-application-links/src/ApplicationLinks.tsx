import { ApplicationsProps } from "./types";

export default function ApplicationLinks(props: ApplicationsProps) {
    const { application, appVal, appType } = props;

    let url: string = "";
    if (application === "ALFRED") {
        if (appType === "USER_ID") {
            url = "https://alfred-tst.u.chimera.azure.cyber.gc.ca/?expression=MATCH%20(email:EMAIL_ADDRESS)%20WHERE%20email.value%20in%20[%22" + appVal + "%22]%20return%20email.value,%20email.maliciousness,%20email.uri"
        } else {
            url = "https://alfred-tst.u.chimera.azure.cyber.gc.ca/?expression=MATCH%20(ip%3AIP_ADDRESS)%20WHERE%20ip.value%20IN%20%5B%22" + appVal + "%22%5D%20RETURN%20ip.value%2C%20ip.maliciousness%2C%20ip.creation_date%2C%20ip.created_by%2C%20ip.uri%2C%20ip.report_uri";
        }
    }

    return (
        <div>
            <p><a href={ url } target="_blank">Visit Alfred</a></p>
        </div>
    );
}
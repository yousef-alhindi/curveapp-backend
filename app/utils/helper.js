const axios = require('axios');

export const randomIntegerGenerate = () => {
    let returnRandom = "";
    for (let index = 0; index < 4; index++) {
        let random = Math.random();
        let rand1 = `${random}`.split(".")[1].substring(0, 2);
        returnRandom = `${returnRandom}${rand1}`;
    }
    return returnRandom;
};

const getDistanceMatrix = async (startLat, startLng, endLat, endLng, mode, apiKey) => {
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${startLat},${startLng}&destinations=${endLat},${endLng}&mode=${mode}&key=${apiKey}`;
    const response = await axios.get(url);
    return response.data;
};

export const getEstimatedTime = async (startLat, startLng, endLat, endLng) => {
    const apiKey = 'AIzaSyA01IPdI_CmuQezU01YuC470ZtdrJ-OgoE';

    const modes = ['bicycling', 'driving', 'walking', 'transit'];
    try {
        let estimatedTime = null;

        for (const mode of modes) {
            const data = await getDistanceMatrix(startLat, startLng, endLat, endLng, mode, apiKey);

            if (data.status === 'OK') {
                const element = data.rows[0]?.elements[0];
                if (element?.status === 'OK') {
                    estimatedTime = element.duration.text;
                    break;
                }
            }
        }

        if (estimatedTime) {
            return estimatedTime;
        } else {
            console.warn('No valid route found after trying all modes');
            return "14-16 mins";
        }
    } catch (error) {
        console.error('Error fetching estimated time:', error.message);
        return "25-30 mins";
    }
};

export const getKmRange = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return Math.ceil(distance);
}

const toRadians = (degrees) => {
    return degrees * (Math.PI / 180);
}

export const generateReferralCode = () => {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";

  const randomLetters = Array.from({ length: 4 }, () =>
    letters.charAt(Math.floor(Math.random() * letters.length))
  ).join("");

  const randomNumbers = Array.from({ length: 5 }, () =>
    numbers.charAt(Math.floor(Math.random() * numbers.length))
  ).join("");

  return `${randomLetters}${randomNumbers}USR`;
};
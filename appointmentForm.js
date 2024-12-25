import { LightningElement } from 'lwc';
import getAppointmentSlotIsAvaliable from '@salesforce/apex/appointmentValidtion.appointmentSlotIsAvaliable';
import getSlotIsBook from '@salesforce/apex/appointmentValidtion.slotIsBook';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import ACCOUNTDETAILSOBJECT from '@salesforce/schema/Appointment_Detail__c';
import CONTACT_FILED from '@salesforce/schema/Appointment_Detail__c.Contact__c';
import SUBJECT_FIELD from '@salesforce/schema/Appointment_Detail__c.Subject__c';
import APPOINTMENT_DATE_FIELD from '@salesforce/schema/Appointment_Detail__c.Appointment_Date__c';
import APPOINTMENT_TIME_FIELD from '@salesforce/schema/Appointment_Detail__c.Appointment_Time__c';
import DESCRIPTION_FIELD from '@salesforce/schema/Appointment_Detail__c.Description__c';



export default class AppointmentForm extends LightningElement {
    objectApiName = ACCOUNTDETAILSOBJECT;
    fields = [CONTACT_FILED, SUBJECT_FIELD, APPOINTMENT_DATE_FIELD, APPOINTMENT_TIME_FIELD, DESCRIPTION_FIELD];


    timeStringToMilliseconds(timeString) {
        const [hours, minutes, seconds] = timeString.split(':').map(Number);
        return (hours * 60 * 60 * 1000) + (minutes * 60 * 1000) + (seconds * 1000);
    }

    millisecondsToTimeString(ms) {
        const hours = Math.floor(ms / (1000 * 60 * 60)); // Extract hours
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60)); // Extract minutes
        const seconds = Math.floor((ms % (1000 * 60)) / 1000); // Extract seconds
        const milliseconds = ms % 1000; // Extract remaining milliseconds

        // Format as HH:mm:ss.SSS
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
    }

    userInputData;
    bookSlotId;
    async handleSubmit(event) {
        try {
            event.preventDefault();

            this.userInputData = event.detail.fields;

            if (!this.userInputData.Appointment_Date__c || !this.userInputData.Appointment_Time__c || !this.userInputData.Contact__c || !this.userInputData.Subject__c.trim() || !this.userInputData.Description__c.trim()) {
                const EmptyFilledEvent = new ShowToastEvent({
                    title: 'ALL FIELD ARE REQUIRED',
                    message:
                        'all fields are required to be filled',
                    variant: "error"
                });
                this.dispatchEvent(EmptyFilledEvent);
            } else {
                // check user selected slote are avaliable or not

                const isAvliable = await getAppointmentSlotIsAvaliable({ AppointmentDate: this.userInputData.Appointment_Date__c, AppointmentTime: this.userInputData.Appointment_Time__c });

                console.log(isAvliable);
                if (isAvliable.length && !isAvliable[0].isActive__c) {
                    this.bookSlotId = isAvliable[0].Id

                    this.userInputData.Appointment_Time__c = this.millisecondsToTimeString(isAvliable[0].Start_Time__c);


                    return await this.template.querySelector('lightning-record-form').submit(this.userInputData);

                } else {

                    const DuplicateEvent = new ShowToastEvent({
                        title: 'Appointment slot are not avaliable',
                        message:
                            'you selected slot are not avaliable',
                        varient: 'warning'
                    });
                    this.dispatchEvent(DuplicateEvent);
                }

            }

        } catch (error) {
            throw Error({ message: error });
        }



    }

    async handleSuccess(res) {
        try {
            const storeData = res.detail.fields;

            await getSlotIsBook({ recordId: this.bookSlotId });


            const event = new ShowToastEvent({
                title: 'Appointment are created',
                message:
                    'Appointemnt book on this date' + ' ' + storeData.Appointment_Date__c.displayValue + ' ' + storeData.Appointment_Time__c.displayValue,
                variant: 'success'
            });
            this.dispatchEvent(event);

            this.template.querySelector('lightning-record-form').reset();

        } catch (error) {

            const event = new ShowToastEvent({
                title: 'error are occur',
                message:
                    'ERROR ARE OCCURE' + ' ' + 'AppointmentForm.JS' + ' ' + JSON.stringify(error.getMessage()),
                variant: 'error'
            });
            this.dispatchEvent(event);
        }

    }

}
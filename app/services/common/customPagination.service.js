

export const customPaginate = (data, page, pageSize) => {
    try{
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        return data.slice(start, end);
    }catch(err){
        return err.message;
    }
}